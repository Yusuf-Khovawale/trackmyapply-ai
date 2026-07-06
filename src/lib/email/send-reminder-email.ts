import { getEmailClient } from "@/lib/email/email-client";

export type ReminderEmailInput = {
  to: string;
  taskTitle: string;
  company: string;
  role: string;
  reminderAt: Date;
  tone: "overdue" | "today";
  taskUrl: string;
  unsubscribeUrl: string;
};

const FROM_ADDRESS =
  process.env.REMINDER_EMAIL_FROM || "TrackMyApply AI <reminders@trackmyapply.app>";

function formatReminderDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// One distinct, independently testable function per feature (matches the
// AI features' convention — see docs/architecture.md §6): composes and
// sends exactly one reminder email. Plain text only, restrained copy —
// task, application context, reminder date, a link back into the app.
export async function sendReminderEmail(input: ReminderEmailInput): Promise<void> {
  const client = getEmailClient();
  const dateLabel = formatReminderDate(input.reminderAt);
  const subject =
    input.tone === "overdue"
      ? `Overdue reminder: ${input.taskTitle}`
      : `Reminder due today: ${input.taskTitle}`;

  const text =
    `${input.taskTitle}\n` +
    `${input.role} at ${input.company}\n` +
    `Reminder date: ${dateLabel}${input.tone === "overdue" ? " (overdue)" : " (today)"}\n\n` +
    `Open it in TrackMyApply AI: ${input.taskUrl}\n\n` +
    `---\n` +
    `Don't want reminder emails? Unsubscribe: ${input.unsubscribeUrl}\n` +
    `You can re-enable them anytime in Settings.`;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject,
    text,
  });
}

export type ReminderDigestItem = {
  taskTitle: string;
  company: string;
  role: string;
  reminderAt: Date;
  tone: "overdue" | "today";
  taskUrl: string;
};

export type ReminderDigestEmailInput = {
  to: string;
  reminders: ReminderDigestItem[];
  unsubscribeUrl: string;
};

// Milestone 7 (batch 6): daily-digest mode's single email — one per user
// per day, bundling every currently-eligible reminder (overdue + due
// today). Same plain-text, restrained style as sendReminderEmail; the
// caller (reminder-emails.ts) guarantees `reminders` is never empty before
// calling this, since an empty digest should never be sent.
export async function sendReminderDigestEmail(
  input: ReminderDigestEmailInput,
): Promise<void> {
  const client = getEmailClient();
  const overdueCount = input.reminders.filter((r) => r.tone === "overdue").length;
  const dueTodayCount = input.reminders.length - overdueCount;

  const subject = `${input.reminders.length} reminder${input.reminders.length === 1 ? "" : "s"} need your attention`;

  const summary =
    overdueCount > 0 && dueTodayCount > 0
      ? `${overdueCount} overdue and ${dueTodayCount} due-today reminder${input.reminders.length === 1 ? "" : "s"}`
      : overdueCount > 0
        ? `${overdueCount} overdue reminder${overdueCount === 1 ? "" : "s"}`
        : `${dueTodayCount} due-today reminder${dueTodayCount === 1 ? "" : "s"}`;

  const items = input.reminders
    .map(
      (r) =>
        `- ${r.taskTitle} (${r.role} at ${r.company}) — ` +
        `${formatReminderDate(r.reminderAt)}${r.tone === "overdue" ? " (overdue)" : " (today)"}\n` +
        `  ${r.taskUrl}`,
    )
    .join("\n\n");

  const text =
    `You have ${summary}:\n\n` +
    `${items}\n\n` +
    `---\n` +
    `Don't want reminder emails? Unsubscribe: ${input.unsubscribeUrl}\n` +
    `You can re-enable them anytime in Settings.`;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject,
    text,
  });
}
