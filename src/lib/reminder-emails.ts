import { prisma } from "@/lib/prisma";
import {
  isReminderOverdue,
  isReminderDueToday,
  startOfTodayUTC,
} from "@/lib/task-status";
import {
  sendReminderEmail,
  sendReminderDigestEmail,
} from "@/lib/email/send-reminder-email";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token";

// Production readiness: on Vercel, fall back to the platform's own
// auto-injected URL env vars (no protocol prefix) when APP_BASE_URL isn't
// explicitly set — VERCEL_PROJECT_PRODUCTION_URL (the stable production
// domain) takes priority over VERCEL_URL (the current deployment's own
// URL, which differs per preview deploy), so reminder emails link
// somewhere real without requiring extra config for the common case.
function resolveAppBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost}`;
  }
  return "http://localhost:3000";
}

const APP_BASE_URL = resolveAppBaseUrl();

export type EligibleReminder = {
  taskId: string;
  userId: string;
  userEmail: string;
  frequency: "IMMEDIATE" | "DAILY_DIGEST";
  lastDigestEmailSentAt: Date | null;
  applicationId: string;
  title: string;
  reminderAt: Date;
  tone: "overdue" | "today";
  company: string;
  role: string;
};

// The selection logic, isolated from actually sending anything — so it can
// be exercised directly against real data without needing email provider
// credentials configured. Reuses isReminderOverdue/isReminderDueToday
// (Batch 1) rather than re-deriving the overdue/due-today rules.
//
// Eligibility, in order:
//   - user has opted in (emailRemindersEnabled) — conservative default off
//   - task is unfinished (TODO/DOING only, enforced at the query level)
//   - task's reminder isn't dashboard-dismissed (reminderDismissedAt null)
//   - reminder is currently overdue or due today (not future, not absent)
//   - no reminder email already sent for this task since today's UTC
//     midnight — at most one email per task per day (this is the only
//     dedup rule applied here; digest-mode's per-user dedup is applied in
//     sendDueReminderEmails, since it needs the whole per-user group)
export async function findEligibleReminderEmails(): Promise<EligibleReminder[]> {
  const tasks = await prisma.task.findMany({
    where: {
      reminderAt: { not: null },
      reminderDismissedAt: null,
      status: { in: ["TODO", "DOING"] },
      user: { emailRemindersEnabled: true },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      reminderAt: true,
      status: true,
      applicationId: true,
      lastReminderEmailSentAt: true,
      application: { select: { company: true, role: true } },
      user: {
        select: {
          email: true,
          reminderEmailFrequency: true,
          lastDigestEmailSentAt: true,
        },
      },
    },
  });

  const start = startOfTodayUTC();

  const eligible: EligibleReminder[] = [];
  for (const task of tasks) {
    if (
      task.lastReminderEmailSentAt &&
      task.lastReminderEmailSentAt.getTime() >= start.getTime()
    ) {
      continue;
    }
    const overdue = isReminderOverdue(task);
    const dueToday = isReminderDueToday(task);
    if (!overdue && !dueToday) {
      continue;
    }
    eligible.push({
      taskId: task.id,
      userId: task.userId,
      userEmail: task.user.email,
      frequency: task.user.reminderEmailFrequency,
      lastDigestEmailSentAt: task.user.lastDigestEmailSentAt,
      applicationId: task.applicationId,
      title: task.title,
      reminderAt: task.reminderAt!,
      tone: overdue ? "overdue" : "today",
      company: task.application.company,
      role: task.application.role,
    });
  }
  return eligible;
}

export type SendDueReminderEmailsResult = {
  sent: number;
  failed: number;
};

function taskUrlFor(applicationId: string) {
  return `${APP_BASE_URL}/dashboard/applications/${applicationId}/tasks`;
}

// Groups eligible reminders by user, then sends either:
//   - IMMEDIATE: one email per reminder (unchanged from Batch 4), or
//   - DAILY_DIGEST: one email per user bundling all of that user's eligible
//     reminders, skipped entirely if a digest already went out today or if
//     the user has no eligible reminders (never send an empty digest).
//
// Both modes only mark their dedup field(s) after a successful send, so a
// failed or not-yet-configured send is retried on the next run rather than
// silently dropped.
export async function sendDueReminderEmails(): Promise<SendDueReminderEmailsResult> {
  const eligible = await findEligibleReminderEmails();
  const start = startOfTodayUTC();
  let sent = 0;
  let failed = 0;

  const byUser = new Map<string, EligibleReminder[]>();
  for (const reminder of eligible) {
    const group = byUser.get(reminder.userId);
    if (group) {
      group.push(reminder);
    } else {
      byUser.set(reminder.userId, [reminder]);
    }
  }

  for (const reminders of byUser.values()) {
    const { userId, userEmail, frequency, lastDigestEmailSentAt } = reminders[0];
    const unsubscribeUrl = `${APP_BASE_URL}/unsubscribe?token=${createUnsubscribeToken(userId)}`;

    if (frequency === "DAILY_DIGEST") {
      if (
        lastDigestEmailSentAt &&
        lastDigestEmailSentAt.getTime() >= start.getTime()
      ) {
        continue; // already sent this user's digest today
      }
      try {
        await sendReminderDigestEmail({
          to: userEmail,
          reminders: reminders.map((r) => ({
            taskTitle: r.title,
            company: r.company,
            role: r.role,
            reminderAt: r.reminderAt,
            tone: r.tone,
            taskUrl: taskUrlFor(r.applicationId),
          })),
          unsubscribeUrl,
        });
        const now = new Date();
        await prisma.task.updateMany({
          where: { id: { in: reminders.map((r) => r.taskId) } },
          data: { lastReminderEmailSentAt: now },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { lastDigestEmailSentAt: now },
        });
        sent++;
      } catch (error) {
        failed++;
        console.error(`Failed to send reminder digest for user ${userId}:`, error);
      }
      continue;
    }

    // IMMEDIATE: one email per reminder, unchanged from Batch 4.
    for (const reminder of reminders) {
      try {
        await sendReminderEmail({
          to: reminder.userEmail,
          taskTitle: reminder.title,
          company: reminder.company,
          role: reminder.role,
          reminderAt: reminder.reminderAt,
          tone: reminder.tone,
          taskUrl: taskUrlFor(reminder.applicationId),
          unsubscribeUrl,
        });
        await prisma.task.update({
          where: { id: reminder.taskId },
          data: { lastReminderEmailSentAt: new Date() },
        });
        sent++;
      } catch (error) {
        failed++;
        console.error(
          `Failed to send reminder email for task ${reminder.taskId}:`,
          error,
        );
      }
    }
  }

  return { sent, failed };
}
