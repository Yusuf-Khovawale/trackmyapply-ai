import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/generated/prisma/client";

// GetHired AI mentor behavior: reminders are created automatically from
// what's happening with an application — the user never has to remember to
// set them. Each status maps to the next best action; tasks are created
// with both a dueDate and a reminderAt so they surface on the dashboard,
// in login pop-ups, and (if enabled in Settings) via reminder emails.
const AUTO_TASK_RULES: Partial<
  Record<ApplicationStatus, { title: (company: string) => string; inDays: number }>
> = {
  SAVED: {
    title: (company) => `Apply to ${company}`,
    inDays: 2,
  },
  APPLIED: {
    title: (company) => `Follow up with ${company}`,
    inDays: 5,
  },
  SCREENING: {
    title: (company) => `Check in on ${company} screening`,
    inDays: 4,
  },
  INTERVIEW: {
    title: (company) => `Prepare for ${company} interview`,
    inDays: 1,
  },
  OFFER: {
    title: (company) => `Review and respond to ${company} offer`,
    inDays: 1,
  },
};

function daysFromNowUtc(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

// Fire-and-forget safe: failures are logged, never thrown, so an auto
// reminder can't break the create/update flow it piggybacks on.
export async function ensureAutoTaskForStatus(
  userId: string,
  applicationId: string,
  company: string,
  status: ApplicationStatus,
): Promise<void> {
  const rule = AUTO_TASK_RULES[status];
  if (!rule) return;

  const title = rule.title(company);
  try {
    // Dedupe: skip if an open task with this exact title already exists
    // for this application (e.g. the status was toggled back and forth).
    const existing = await prisma.task.findFirst({
      where: {
        applicationId,
        userId,
        title,
        status: { in: ["TODO", "DOING"] },
      },
      select: { id: true },
    });
    if (existing) return;

    const when = daysFromNowUtc(rule.inDays);
    await prisma.task.create({
      data: {
        applicationId,
        userId,
        title,
        status: "TODO",
        dueDate: when,
        reminderAt: when,
      },
    });
  } catch (error) {
    console.error("Auto-task creation failed:", error);
  }
}
