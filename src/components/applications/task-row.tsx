"use client";

import { useState, useTransition } from "react";
import type { Task } from "@/generated/prisma/client";
import { TaskStatusSelect } from "@/components/applications/task-status-select";
import { DeleteTaskButton } from "@/components/applications/delete-task-button";
import { formatDisplayDate, toDateInputValue } from "@/lib/date";
import {
  isTaskOverdue,
  isReminderOverdue,
  isReminderDueToday,
} from "@/lib/task-status";
import { updateTask } from "@/app/(app)/dashboard/applications/[id]/tasks/actions";

const fieldClass =
  "rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/[.145] dark:focus:border-white/40";

export function TaskRow({
  applicationId,
  task,
}: {
  applicationId: string;
  task: Task;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [reminderAt, setReminderAt] = useState(
    toDateInputValue(task.reminderAt),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const overdue = isTaskOverdue(task);
  const reminderOverdue = isReminderOverdue(task);
  const reminderDueToday = isReminderDueToday(task);

  const rowClass =
    "border-b border-black/[.08] last:border-0 dark:border-white/[.145]";

  if (editing) {
    return (
      <tr className={rowClass}>
        <td className="px-4 py-3" colSpan={2}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`flex-1 ${fieldClass}`}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={fieldClass}
              aria-label="Due date"
            />
            <input
              type="date"
              value={reminderAt}
              onChange={(event) => setReminderAt(event.target.value)}
              className={fieldClass}
              aria-label="Reminder"
            />
          </div>
          {error ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <TaskStatusSelect
            applicationId={applicationId}
            id={task.id}
            status={task.status}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await updateTask(applicationId, task.id, {
                    title,
                    dueDate,
                    reminderAt,
                  });
                  if (result?.error) {
                    setError(result.error);
                  } else {
                    setEditing(false);
                  }
                });
              }}
              className="text-sm font-medium text-black hover:underline disabled:opacity-60 dark:text-zinc-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(task.title);
                setDueDate(toDateInputValue(task.dueDate));
                setReminderAt(toDateInputValue(task.reminderAt));
                setError(null);
                setEditing(false);
              }}
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={rowClass}>
      <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
        {task.title}
      </td>
      <td
        className={`px-4 py-3 ${
          overdue
            ? "font-medium text-red-600 dark:text-red-400"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {formatDisplayDate(task.dueDate)}
        {overdue ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            Overdue
          </span>
        ) : null}
        {task.reminderAt ? (
          <p
            className={`mt-1 text-xs font-normal ${
              reminderOverdue
                ? "font-medium text-red-600 dark:text-red-400"
                : reminderDueToday
                  ? "font-medium text-amber-700 dark:text-amber-400"
                  : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Reminder {formatDisplayDate(task.reminderAt)}
            {reminderOverdue ? " · Overdue" : reminderDueToday ? " · Today" : ""}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <TaskStatusSelect
          applicationId={applicationId}
          id={task.id}
          status={task.status}
        />
        {task.status === "DONE" && task.completedAt ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Completed {formatDisplayDate(task.completedAt)}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-black hover:underline dark:text-zinc-50"
          >
            Edit
          </button>
          <DeleteTaskButton applicationId={applicationId} id={task.id} />
        </div>
      </td>
    </tr>
  );
}
