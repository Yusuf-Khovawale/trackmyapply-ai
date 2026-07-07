import Link from "next/link";
import { auth } from "@/auth";

const FEATURES = [
  {
    title: "Track every application",
    description:
      "Statuses, follow-ups, and tasks for each role — nothing slips through the cracks.",
  },
  {
    title: "Tailor your resume with AI",
    description:
      "Generate a job-specific resume draft from any saved job description in one click.",
  },
  {
    title: "Prep for interviews",
    description:
      "AI-generated likely questions, STAR stories, and company research per application.",
  },
] as const;

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-8 rounded-full border border-white/[.12] bg-white/[.05] px-4 py-1.5 text-xs font-medium tracking-wide text-indigo-200 backdrop-blur-md">
        Your job search, organized
      </span>

      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl sm:leading-[1.15]">
        Track your job search, tailor your resume, and{" "}
        <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
          prep with confidence
        </span>
        .
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
        TrackMyApply AI keeps every application, resume version, and next step
        in one place.
      </p>

      <div className="mt-10">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="btn-primary rounded-full px-7 py-3 text-sm"
          >
            Go to dashboard
          </Link>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/sign-up"
              className="btn-primary rounded-full px-7 py-3 text-sm"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/sign-in"
              className="btn-secondary rounded-full px-7 py-3 text-sm"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      <div className="mt-24 grid w-full max-w-4xl gap-5 text-left sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="glass-card glass-card-hover p-6"
          >
            <h2 className="text-sm font-semibold text-zinc-50">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
