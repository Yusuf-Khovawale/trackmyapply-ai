import Link from "next/link";
import { ResumeForm } from "@/components/resumes/resume-form";
import { createResume } from "@/app/(app)/dashboard/resumes/actions";
import { requireUserId } from "@/lib/auth-guard";

export default async function NewResumePage() {
  await requireUserId();

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          New resume
        </h1>
        <Link
          href="/dashboard/resumes"
          className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to resumes
        </Link>
      </div>

      <div className="max-w-2xl">
        <ResumeForm action={createResume} submitLabel="Add resume" />
      </div>
    </div>
  );
}
