import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { updateResume } from "@/app/(app)/dashboard/resumes/actions";
import { ResumeForm } from "@/components/resumes/resume-form";

export default async function EditResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const resume = await prisma.resume.findFirst({
    where: { id, userId },
  });

  if (!resume) {
    notFound();
  }

  const boundUpdate = updateResume.bind(null, resume.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Edit resume
        </h1>
        <Link
          href="/dashboard/resumes"
          className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
        >
          ← Back to resumes
        </Link>
      </div>

      <div className="max-w-2xl">
        <ResumeForm
          action={boundUpdate}
          submitLabel="Save changes"
          defaultValues={{
            title: resume.title,
            versionLabel: resume.versionLabel ?? undefined,
            baseRole: resume.baseRole ?? undefined,
            fileUrl: resume.fileUrl ?? undefined,
            content: resume.content ?? undefined,
            notes: resume.notes ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
