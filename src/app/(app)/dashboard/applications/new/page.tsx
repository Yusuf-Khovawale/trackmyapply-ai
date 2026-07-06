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
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Add application
        </h1>
        <Link
          href="/dashboard"
          className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
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
