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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Tailor resume
        </h1>
        <Link
          href={`/dashboard/applications/${application.id}/edit`}
          className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
        >
          ← Back to application
        </Link>
      </div>

      <div className="max-w-2xl glass-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-50">
              {application.role}
            </p>
            <p className="text-sm text-zinc-400">
              {application.company}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      {!application.jobDescription ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-white/10 p-8">
          <p className="text-zinc-300">
            This application doesn&apos;t have a job description saved yet.
            Add one before generating a tailored draft.
          </p>
          <Link
            href={`/dashboard/applications/${application.id}/edit`}
            className="rounded-full btn-primary px-5 py-2 text-sm"
          >
            Add job description
          </Link>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-white/10 p-8">
          <p className="text-zinc-300">
            You don&apos;t have any saved resumes yet. Add one to use as a
            tailoring base.
          </p>
          <Link
            href="/dashboard/resumes/new"
            className="rounded-full btn-primary px-5 py-2 text-sm"
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
