"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    undefined,
  );

  if (state?.status === "done") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Password updated
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your password has been changed. You can now sign in with your new
            password.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="rounded-full btn-primary px-5 py-2 text-center text-sm"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (state?.status === "invalid") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="font-medium text-zinc-50">
          This reset link is invalid or has expired.
        </p>
        <p className="text-sm text-zinc-400">
          <Link href="/forgot-password" className="font-medium text-zinc-50">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a new password for your account.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="glass-input px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm new password
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="glass-input px-3 py-2 text-sm"
          />
        </label>

        {state?.status === "error" ? (
          <p className="text-sm text-red-400">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
        >
          {isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
