"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/(app)/dashboard/applications/[id]/tasks/actions";

// Calls the exact same updateTaskStatus action TaskStatusSelect uses on the
// per-application tasks page — same ownership scoping, same completedAt
// behavior. This is a single-purpose shortcut (unfinished → DONE only), not
// a re-implementation of that page's full status control.
export function MarkTaskDoneButton({
  applicationId,
  id,
}: {
  applicationId: string;
  id: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="text-xs text-zinc-400">
        Marked done
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateTaskStatus(applicationId, id, "DONE");
            if (result?.error) {
              setError(result.error);
            } else {
              setDone(true);
            }
          });
        }}
        className="text-xs font-medium text-zinc-50 hover:underline disabled:opacity-60"
      >
        {isPending ? "Marking…" : "Mark done"}
      </button>
      {error ? (
        <span className="text-xs text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
