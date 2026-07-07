"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmUnsubscribe } from "./actions";

export function UnsubscribeConfirm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmUnsubscribe,
    undefined,
  );

  if (state?.status === "done") {
    return (
      <>
        <p className="font-medium text-zinc-50">
          You&apos;ve been unsubscribed from reminder emails.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          You can re-enable them anytime in{" "}
          <Link
            href="/dashboard/settings"
            className="font-medium text-indigo-300 underline-offset-2 hover:underline"
          >
            Settings
          </Link>
          .
        </p>
      </>
    );
  }

  if (state?.status === "invalid") {
    return (
      <p className="font-medium text-zinc-50">
        This unsubscribe link is invalid.
      </p>
    );
  }

  return (
    <>
      <p className="font-medium text-zinc-50">
        Unsubscribe from reminder emails?
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        You&apos;ll stop receiving task reminder emails from TrackMyApply AI.
      </p>
      <form action={formAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full rounded-full px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {isPending ? "Unsubscribing…" : "Yes, unsubscribe me"}
        </button>
      </form>
    </>
  );
}
