import Link from "next/link";
import { ResumeForm } from "@/components/resumes/resume-form";
import { createResume } from "@/app/(app)/dashboard/resumes/actions";
import { requireUserId } from "@/lib/auth-guard";

export default async function NewResumePage() {
  await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          New resume
        </h1>
        <Link
          href="/dashboard/resumes"
          className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
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
