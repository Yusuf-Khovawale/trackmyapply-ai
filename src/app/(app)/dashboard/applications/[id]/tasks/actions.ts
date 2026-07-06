"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  taskInputSchema,
  taskEditInputSchema,
  taskStatusSchema,
} from "@/lib/validation/task";

export type TaskActionState = { error?: string } | undefined;

async function assertApplicationOwnership(
  applicationId: string,
  userId: string,
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  return Boolean(application);
}

export async function createTask(
  applicationId: string,
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const userId = await requireUserId();

  const parsed = taskInputSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate"),
    reminderAt: formData.get("reminderAt"),
    status: formData.get("status") || "TODO",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await assertApplicationOwnership(applicationId, userId))) {
    return { error: "Application not found." };
  }

  const { dueDate, reminderAt, status } = parsed.data;

  await prisma.task.create({
    data: {
      applicationId,
      userId,
      title: parsed.data.title,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  return undefined;
}

// applicationId is bound at the call site (same pattern as
// updateApplicationStatus) purely so the revalidated path can be scoped to
// this application's tasks page rather than something broader.
//
// Also called directly (not bound) from the dashboard's "Mark done" quick
// action (Milestone 6 Batch 4), so it revalidates the dashboard too — the
// same status-update logic and ownership scoping, just triggerable from a
// second page.
export async function updateTaskStatus(
  applicationId: string,
  id: string,
  status: string,
) {
  const userId = await requireUserId();
  const parsedStatus = taskStatusSchema.safeParse(status);

  if (!parsedStatus.success) {
    return { error: "Invalid status." };
  }

  // updateMany scoped by (id, userId) so a user can never mutate another
  // user's task, even by guessing an id.
  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: {
      status: parsedStatus.data,
      completedAt: parsedStatus.data === "DONE" ? new Date() : null,
    },
  });

  if (result.count === 0) {
    return { error: "Task not found." };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  revalidatePath("/dashboard");
  return { success: true as const };
}

// Direct callable (not a useActionState form action) — mirrors
// TaskStatusSelect's calling convention: the inline row editor manages its
// own draft title/due-date as local state and calls this straight from a
// button handler, same as updateTaskStatus above.
export async function updateTask(
  applicationId: string,
  id: string,
  input: { title: string; dueDate?: string; reminderAt?: string },
) {
  const userId = await requireUserId();

  const parsed = taskEditInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // updateMany scoped by (id, userId) so a user can never mutate another
  // user's task, even by guessing an id.
  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: {
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      reminderAt: parsed.data.reminderAt
        ? new Date(parsed.data.reminderAt)
        : null,
      // Editing the reminder is a fresh start — clears any prior dismiss so
      // a stale dismiss flag can't silently suppress the edited reminder.
      reminderDismissedAt: null,
    },
  });

  if (result.count === 0) {
    return { error: "Task not found." };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  return { success: true as const };
}

const SNOOZE_PRESET_DAYS = [1, 7] as const;

// Milestone 7 (batch 3): "snooze" always computes the new reminderAt from
// today, not from the old reminderAt — so an already-overdue reminder moves
// to a genuinely near date rather than staying overdue. Also clears any
// dismiss flag (snoozing is an explicit "remind me again" signal).
export async function snoozeReminder(
  applicationId: string,
  id: string,
  days: number,
) {
  const userId = await requireUserId();

  if (!SNOOZE_PRESET_DAYS.includes(days as (typeof SNOOZE_PRESET_DAYS)[number])) {
    return { error: "Invalid snooze amount." };
  }

  const newReminderAt = new Date();
  newReminderAt.setUTCHours(0, 0, 0, 0);
  newReminderAt.setUTCDate(newReminderAt.getUTCDate() + days);

  // updateMany scoped by (id, userId) so a user can never mutate another
  // user's task, even by guessing an id.
  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: { reminderAt: newReminderAt, reminderDismissedAt: null },
  });

  if (result.count === 0) {
    return { error: "Task not found." };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  revalidatePath("/dashboard");
  return { success: true as const };
}

// Hides a reminder from the dashboard's active reminder surface without
// touching dueDate/status or deleting the task — reminderAt itself is left
// intact, only reminderDismissedAt is set. The Tasks page still shows the
// reminder date as normal; only the dashboard's Reminders card excludes it.
export async function dismissReminder(applicationId: string, id: string) {
  const userId = await requireUserId();

  const result = await prisma.task.updateMany({
    where: { id, userId },
    data: { reminderDismissedAt: new Date() },
  });

  if (result.count === 0) {
    return { error: "Task not found." };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  revalidatePath("/dashboard");
  return { success: true as const };
}

// Mirrors deleteApplication/deleteResume's calling convention exactly —
// used by DeleteTaskButton's confirm-step pattern.
export async function deleteTask(applicationId: string, id: string) {
  const userId = await requireUserId();

  const result = await prisma.task.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return { error: "Task not found." };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/tasks`);
  return { success: true as const };
}
