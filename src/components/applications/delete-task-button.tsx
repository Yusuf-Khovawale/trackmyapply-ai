"use client";

import { useState, useTransition } from "react";
import { deleteTask } from "@/app/(app)/dashboard/applications/[id]/tasks/actions";

export function DeleteTaskButton({
  applicationId,
  id,
}: {
  applicationId: string;
  id: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-red-400 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-400">Delete?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await deleteTask(applicationId, id);
            if (result?.error) {
              setError(result.error);
              setConfirming(false);
            }
          });
        }}
        className="font-medium text-red-400 hover:underline disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-zinc-400 hover:underline"
      >
        Cancel
      </button>
      {error ? (
        <span className="text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
