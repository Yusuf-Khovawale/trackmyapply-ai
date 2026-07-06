"use client";

import { useState, useTransition } from "react";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type ApplicationStatusValue,
} from "@/lib/application-status";
import { updateApplicationStatus } from "@/app/(app)/dashboard/actions";

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: ApplicationStatusValue;
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
          const next = event.target.value as ApplicationStatusValue;
          const previous = current;
          setCurrent(next);
          setError(null);
          startTransition(async () => {
            const result = await updateApplicationStatus(id, next);
            if (result?.error) {
              setCurrent(previous);
              setError(result.error);
            }
          });
        }}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 ${STATUS_STYLES[current]}`}
      >
        {APPLICATION_STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
