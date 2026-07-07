"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "../actions";

export default function SignInPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Welcome back to TrackMyApply AI.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="glass-input px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="glass-input px-3 py-2 text-sm"
          />
        </label>

        {errorMessage ? (
          <p className="text-sm text-red-400">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-zinc-50">
          Sign up
        </Link>
      </p>
    </div>
  );
}
