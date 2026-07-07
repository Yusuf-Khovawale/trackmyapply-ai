import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { updateApplication } from "@/app/(app)/dashboard/actions";
import { ApplicationForm } from "@/components/applications/application-form";
import { toDateInputValue } from "@/lib/date";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const [application, resumes] = await Promise.all([
    prisma.application.findFirst({ where: { id, userId } }),
    prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, versionLabel: true },
    }),
  ]);

  if (!application) {
    notFound();
  }

  const boundUpdate = updateApplication.bind(null, application.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Edit application
        </h1>
        <Link
          href="/dashboard"
          className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="max-w-2xl">
        <ApplicationForm
          action={boundUpdate}
          submitLabel="Save changes"
          resumes={resumes}
          defaultValues={{
            company: application.company,
            role: application.role,
            jobUrl: application.jobUrl ?? undefined,
            source: application.source ?? undefined,
            status: application.status,
            dateApplied: toDateInputValue(application.dateApplied),
            resumeVersion: application.resumeVersion ?? undefined,
            resumeId: application.resumeId ?? undefined,
            followUpDate: toDateInputValue(application.followUpDate),
            notes: application.notes ?? undefined,
            jobDescription: application.jobDescription ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
