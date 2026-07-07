"use client";

import { useState, useTransition } from "react";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  type TaskStatusValue,
} from "@/lib/task-status";
import { updateTaskStatus } from "@/app/(app)/dashboard/applications/[id]/tasks/actions";

export function TaskStatusSelect({
  applicationId,
  id,
  status,
}: {
  applicationId: string;
  id: string;
  status: TaskStatusValue;
}) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <select
        value={current}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as TaskStatusValue;
          const previous = current;
          setCurrent(next);
          setError(null);
          startTransition(async () => {
            const result = await updateTaskStatus(applicationId, id, next);
            if (result?.error) {
              setCurrent(previous);
              setError(result.error);
            }
          });
        }}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 ${TASK_STATUS_STYLES[current]}`}
      >
        {TASK_STATUSES.map((value) => (
          <option key={value} value={value}>
            {TASK_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
