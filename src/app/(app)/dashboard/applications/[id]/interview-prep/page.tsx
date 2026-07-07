import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { updateInterviewPrep, generateInterviewPrepContent } from "./actions";
import { InterviewPrepForm } from "@/components/applications/interview-prep-form";
import { StatusBadge } from "@/components/applications/status-badge";
import {
  likelyQuestionsSchema,
  starStoriesSchema,
} from "@/lib/validation/interview-prep";

export default async function InterviewPrepPage({
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

  const prep = await prisma.interviewPrep.findFirst({
    where: { applicationId: id, userId },
  });

  const boundAction = updateInterviewPrep.bind(null, application.id);
  const boundGenerateAction = generateInterviewPrepContent.bind(
    null,
    application.id,
  );

  // Json columns aren't typed at the DB layer — re-validate with the same
  // schemas the action uses rather than trusting the stored shape blindly.
  const likelyQuestions = likelyQuestionsSchema.safeParse(
    prep?.likelyQuestions ?? [],
  );
  const starStories = starStoriesSchema.safeParse(prep?.starStories ?? []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Interview prep
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

      <div className="max-w-2xl">
        <InterviewPrepForm
          action={boundAction}
          generateAction={boundGenerateAction}
          hasJobDescription={Boolean(application.jobDescription)}
          hasLinkedResume={Boolean(application.resumeId)}
          defaultValues={{
            prepNotes: prep?.prepNotes ?? undefined,
            companyResearch: prep?.companyResearch ?? undefined,
            likelyQuestions: likelyQuestions.success
              ? likelyQuestions.data
              : [],
            starStories: starStories.success ? starStories.data : [],
          }}
        />
      </div>
    </div>
  );
}
