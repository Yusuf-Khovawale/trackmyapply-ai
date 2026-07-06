import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { ResumesTable } from "@/components/resumes/resumes-table";

export default async function ResumesPage() {
  const userId = await requireUserId();

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Resumes
          </h1>
          <Link
            href="/dashboard"
            className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            ← Back to dashboard
          </Link>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}{" "}
            saved
          </p>
        </div>
        <Link
          href="/dashboard/resumes/new"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          New resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-zinc-700 dark:text-zinc-300">
            No resumes yet. Add your first version to start tailoring your
            applications.
          </p>
          <Link
            href="/dashboard/resumes/new"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Add your first resume
          </Link>
        </div>
      ) : (
        <ResumesTable resumes={resumes} />
      )}
    </div>
  );
}
