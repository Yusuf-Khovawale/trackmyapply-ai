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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Resumes
          </h1>
          <Link
            href="/dashboard"
            className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
          >
            ← Back to dashboard
          </Link>
          <p className="mt-1 text-sm text-zinc-400">
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}{" "}
            saved
          </p>
        </div>
        <Link
          href="/dashboard/resumes/new"
          className="rounded-full btn-primary px-5 py-2 text-sm"
        >
          New resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-white/10 p-8">
          <p className="text-zinc-300">
            No resumes yet. Add your first version to start tailoring your
            applications.
          </p>
          <Link
            href="/dashboard/resumes/new"
            className="rounded-full btn-primary px-5 py-2 text-sm"
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
