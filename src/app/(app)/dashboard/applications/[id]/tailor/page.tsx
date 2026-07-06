import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { generateTailoredDraft, saveTailoredResume } from "./actions";
import { TailorForm } from "@/components/applications/tailor-form";
import { ContentPreview } from "@/components/applications/content-preview";
import { StatusBadge } from "@/components/applications/status-badge";

export default async function TailorApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const application = await prisma.application.findFirst({
    where: { id, userId },
  });

  if (!application) {
    notFound();
  }

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, versionLabel: true, content: true },
  });

  const boundAction = generateTailoredDraft.bind(null, application.id);
  const boundSaveAction = saveTailoredResume.bind(null, application.id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Tailor resume
        </h1>
        <Link
          href={`/dashboard/applications/${application.id}/edit`}
          className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to application
        </Link>
      </div>

      <div className="max-w-2xl rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-black dark:text-zinc-50">
              {application.role}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {application.company}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      {!application.jobDescription ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-zinc-700 dark:text-zinc-300">
            This application doesn&apos;t have a job description saved yet.
            Add one before generating a tailored draft.
          </p>
          <Link
            href={`/dashboard/applications/${application.id}/edit`}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Add job description
          </Link>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-zinc-700 dark:text-zinc-300">
            You don&apos;t have any saved resumes yet. Add one to use as a
            tailoring base.
          </p>
          <Link
            href="/dashboard/resumes/new"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Add a resume
          </Link>
        </div>
      ) : (
        <>
          <div className="max-w-2xl">
            <ContentPreview
              title="Job description on file"
              content={application.jobDescription}
              maxHeightClassName="max-h-40"
            />
          </div>

          <div className="max-w-5xl">
            <TailorForm
              action={boundAction}
              saveAction={boundSaveAction}
              resumes={resumes}
            />
          </div>
        </>
      )}
    </div>
  );
}
