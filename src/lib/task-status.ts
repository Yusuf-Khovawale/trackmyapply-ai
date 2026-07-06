// Single source of truth for task status values, shared by the Zod
// validation schema and the status UI components. Must match the
// `TaskStatus` enum in prisma/schema.prisma exactly.
export const TASK_STATUSES = ["TODO", "DOING", "DONE", "DISMISSED"] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: "To do",
  DOING: "Doing",
  DONE: "Done",
  DISMISSED: "Dismissed",
};

// Tailwind classes per status, used by the inline status select — mirrors
// application-status.ts's STATUS_STYLES.
export const TASK_STATUS_STYLES: Record<TaskStatusValue, string> = {
  TODO: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  DOING: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  DISMISSED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

type DueDateCheckable = {
  dueDate: Date | string | null;
  status: TaskStatusValue;
};

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

// Exported for the email reminder MVP's dedup check (Milestone 7 Batch 4),
// which needs the exact same day-boundary rule used everywhere else here.
export function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Exported for the dashboard's "Upcoming tasks" list (Milestone 6 Batch 3),
// which needs the same DONE/DISMISSED exclusion used everywhere else here.
export function isUnfinished(status: TaskStatusValue) {
  return status !== "DONE" && status !== "DISMISSED";
}

// A task is overdue only if it has a due date, that date's calendar day has
// already passed (not just "earlier today"), and it isn't finished.
export function isTaskOverdue(task: DueDateCheckable): boolean {
  if (!task.dueDate || !isUnfinished(task.status)) {
    return false;
  }
  return toDate(task.dueDate).getTime() < startOfTodayUTC().getTime();
}

// A task is "due today" if its due date falls on today's calendar day
// (UTC) and it isn't finished — same day-boundary and finished-status
// exclusions as isTaskOverdue, just checking equality instead of "before".
export function isTaskDueToday(task: DueDateCheckable): boolean {
  if (!task.dueDate || !isUnfinished(task.status)) {
    return false;
  }
  const start = startOfTodayUTC();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const dueTime = toDate(task.dueDate).getTime();
  return dueTime >= start.getTime() && dueTime < end.getTime();
}

type ReminderCheckable = {
  reminderAt: Date | string | null;
  status: TaskStatusValue;
};

// Milestone 7 (batch 1): same day-boundary and finished-status exclusions
// as isTaskOverdue/isTaskDueToday above, applied to reminderAt instead of
// dueDate — kept as separate functions (not a shared parameterized helper)
// so the existing due-date behavior everywhere else is untouched.
export function isReminderOverdue(task: ReminderCheckable): boolean {
  if (!task.reminderAt || !isUnfinished(task.status)) {
    return false;
  }
  return toDate(task.reminderAt).getTime() < startOfTodayUTC().getTime();
}

export function isReminderDueToday(task: ReminderCheckable): boolean {
  if (!task.reminderAt || !isUnfinished(task.status)) {
    return false;
  }
  const start = startOfTodayUTC();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const reminderTime = toDate(task.reminderAt).getTime();
  return reminderTime >= start.getTime() && reminderTime < end.getTime();
}

type SortableTask = {
  dueDate: Date | string | null;
  status: TaskStatusValue;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const toTime = (value: Date | string | null) =>
  value ? (typeof value === "string" ? new Date(value) : value).getTime() : null;

// Unfinished tasks (TODO/DOING) always sort before finished ones
// (DONE/DISMISSED). Within the unfinished group, overdue and soon-due tasks
// float to the top (soonest due date first); tasks with no due date sort
// last within that group. Within the finished group, most recently
// completed/updated sorts first.
export function sortTasksForDisplay<T extends SortableTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const aFinished = !isUnfinished(a.status);
    const bFinished = !isUnfinished(b.status);
    if (aFinished !== bFinished) return aFinished ? 1 : -1;

    if (!aFinished) {
      const aDue = toTime(a.dueDate) ?? Infinity;
      const bDue = toTime(b.dueDate) ?? Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return toTime(b.createdAt)! - toTime(a.createdAt)!;
    }

    const aCompleted = toTime(a.completedAt) ?? toTime(a.updatedAt)!;
    const bCompleted = toTime(b.completedAt) ?? toTime(b.updatedAt)!;
    return bCompleted - aCompleted;
  });
}
