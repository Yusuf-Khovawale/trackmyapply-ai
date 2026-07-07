import Link from "next/link";
import { auth, signOut } from "@/auth";

const navLinkClass =
  "rounded-full px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[.06] hover:text-zinc-50";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[.08] bg-[#07080d]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-50"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br from-indigo-400/90 to-violet-600/90 text-xs font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_4px_12px_-2px_rgb(99_102_241/0.5)]"
          >
            T
          </span>
          TrackMyApply{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            AI
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {session?.user ? (
            <>
              <Link href="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link href="/dashboard/resumes" className={navLinkClass}>
                Resumes
              </Link>
              <Link href="/dashboard/settings" className={navLinkClass}>
                Settings
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
                className="ml-2"
              >
                <button
                  type="submit"
                  className="btn-secondary rounded-full px-4 py-1.5 text-sm"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClass}>
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="btn-primary ml-2 rounded-full px-4 py-1.5 text-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
