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
  "glass-input px-3 py-2 text-sm";

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
    "border-b border-white/10 last:border-0";

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
            <p className="mt-1 text-sm text-red-400">
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
              className="text-sm font-medium text-zinc-50 hover:underline disabled:opacity-60"
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
              className="text-sm text-zinc-400 hover:underline"
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
      <td className="px-4 py-3 font-medium text-zinc-50">
        {task.title}
      </td>
      <td
        className={`px-4 py-3 ${
          overdue
            ? "font-medium text-red-400"
            : "text-zinc-400"
        }`}
      >
        {formatDisplayDate(task.dueDate)}
        {overdue ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-red-400/15 px-2 py-0.5 text-xs font-medium text-red-300">
            Overdue
          </span>
        ) : null}
        {task.reminderAt ? (
          <p
            className={`mt-1 text-xs font-normal ${
              reminderOverdue
                ? "font-medium text-red-400"
                : reminderDueToday
                  ? "font-medium text-amber-300"
                  : "text-zinc-400"
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
          <p className="mt-1 text-xs text-zinc-400">
            Completed {formatDisplayDate(task.completedAt)}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-zinc-50 hover:underline"
          >
            Edit
          </button>
          <DeleteTaskButton applicationId={applicationId} id={task.id} />
        </div>
      </td>
    </tr>
  );
}
