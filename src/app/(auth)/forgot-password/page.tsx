"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  if (state?.status === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            If an account exists for that email, we&apos;ve sent a link to
            reset your password. It expires in 1 hour. Be sure to check your
            spam folder if you don&apos;t see it.
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          <Link href="/sign-in" className="font-medium text-zinc-50">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your account email and we&apos;ll send you a link to set a new
          password.
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

        {state?.status === "error" ? (
          <p className="text-sm text-red-400">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-zinc-50">
          Sign in
        </Link>
      </p>
    </div>
  );
}
