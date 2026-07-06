import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
        Track your job search, tailor your resume, and prep with confidence.
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        TrackMyApply AI keeps every application, resume version, and next
        step in one place.
      </p>

      {session?.user ? (
        <Link
          href="/dashboard"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Go to dashboard
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign up
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-black/[.08] px-6 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign in
          </Link>
        </div>
      )}
    </main>
  );
}
