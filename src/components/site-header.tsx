import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
      <Link href="/" className="font-semibold text-black dark:text-zinc-50">
        TrackMyApply AI
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400">
              Dashboard
            </Link>
            <Link
              href="/dashboard/resumes"
              className="text-zinc-600 dark:text-zinc-400"
            >
              Resumes
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-zinc-600 dark:text-zinc-400"
            >
              Settings
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-black/[.08] px-4 py-1.5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="text-zinc-600 dark:text-zinc-400">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-foreground px-4 py-1.5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
