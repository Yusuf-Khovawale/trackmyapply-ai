import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/components/applications/application-form";
import { createApplication } from "@/app/(app)/dashboard/actions";
import { requireUserId } from "@/lib/auth-guard";

export default async function NewApplicationPage() {
  const userId = await requireUserId();

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, versionLabel: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Add application
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
          action={createApplication}
          submitLabel="Add application"
          resumes={resumes}
        />
      </div>
    </div>
  );
}
