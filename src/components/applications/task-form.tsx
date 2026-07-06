"use client";

import { useActionState } from "react";
import type { TaskActionState } from "@/app/(app)/dashboard/applications/[id]/tasks/actions";

const fieldClass =
  "rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/[.145] dark:focus:border-white/40";

export function TaskForm({
  action,
}: {
  action: (
    prevState: TaskActionState,
    formData: FormData,
  ) => Promise<TaskActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Action
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. Send thank-you email"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Due date
        <input name="dueDate" type="date" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Reminder
        <input name="reminderAt" type="date" className={fieldClass} />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? "Adding…" : "Add task"}
      </button>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
