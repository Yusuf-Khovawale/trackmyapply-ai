"use client";

import { useState, useTransition } from "react";
import {
  snoozeReminder,
  dismissReminder,
} from "@/app/(app)/dashboard/applications/[id]/tasks/actions";
import { MarkTaskDoneButton } from "@/components/dashboard/mark-task-done-button";

const SNOOZE_PRESETS = [
  { label: "+1 day", days: 1 },
  { label: "+1 week", days: 7 },
] as const;

const buttonClass =
  "text-xs font-medium text-black hover:underline disabled:opacity-60 dark:text-zinc-50";

export function ReminderActions({
  applicationId,
  id,
}: {
  applicationId: string;
  id: string;
}) {
  const [result, setResult] = useState<"snoozed" | "dismissed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (result === "snoozed") {
    return (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Snoozed
      </span>
    );
  }
  if (result === "dismissed") {
    return (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Dismissed
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {SNOOZE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const outcome = await snoozeReminder(
                  applicationId,
                  id,
                  preset.days,
                );
                if (outcome?.error) {
                  setError(outcome.error);
                } else {
                  setResult("snoozed");
                }
              });
            }}
            className={buttonClass}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const outcome = await dismissReminder(applicationId, id);
              if (outcome?.error) {
                setError(outcome.error);
              } else {
                setResult("dismissed");
              }
            });
          }}
          className="text-xs text-zinc-500 hover:underline disabled:opacity-60 dark:text-zinc-400"
        >
          Dismiss
        </button>
      </div>
      <MarkTaskDoneButton applicationId={applicationId} id={id} />
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
