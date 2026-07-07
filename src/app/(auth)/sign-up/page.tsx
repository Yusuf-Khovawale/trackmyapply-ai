"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAndSignIn } from "../actions";

export default function SignUpPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    registerAndSignIn,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Start tracking your job search with TrackMyApply AI.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="glass-input px-3 py-2 text-sm"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
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
          {isPending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-zinc-50">
          Sign in
        </Link>
      </p>
    </div>
  );
}
