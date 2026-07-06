"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  interviewPrepTextInputSchema,
  likelyQuestionsSchema,
  starStoriesSchema,
  generatedCompanyResearchSchema,
  type LikelyQuestion,
  type StarStory,
} from "@/lib/validation/interview-prep";
import { generateInterviewPrep } from "@/lib/ai/generate-interview-prep";
import type { Prisma } from "@/generated/prisma/client";

export type InterviewPrepActionState = { error: string } | undefined;

async function assertApplicationOwnership(
  applicationId: string,
  userId: string,
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  return Boolean(application);
}

type InterviewPrepUpsertData = {
  prepNotes?: string | null;
  companyResearch?: string | null;
  likelyQuestions?: Prisma.InputJsonValue;
  starStories?: Prisma.InputJsonValue;
};

// Single upsert path shared by the text-form action and the structured-data
// helper below, so "create if missing, else update" only lives in one place.
function upsertInterviewPrep(
  userId: string,
  applicationId: string,
  data: InterviewPrepUpsertData,
) {
  return prisma.interviewPrep.upsert({
    where: { applicationId },
    create: { applicationId, userId, ...data },
    update: data,
  });
}

// Form-based action for the prep notes / company research fields — the
// only editable-as-plain-text surface until the full prep UI (a later
// batch) exists.
export async function updateInterviewPrepText(
  applicationId: string,
  _prevState: InterviewPrepActionState,
  formData: FormData,
): Promise<InterviewPrepActionState> {
  const userId = await requireUserId();

  const parsed = interviewPrepTextInputSchema.safeParse({
    prepNotes: formData.get("prepNotes"),
    companyResearch: formData.get("companyResearch"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await assertApplicationOwnership(applicationId, userId))) {
    return { error: "Application not found." };
  }

  await upsertInterviewPrep(userId, applicationId, {
    prepNotes: parsed.data.prepNotes ?? null,
    companyResearch: parsed.data.companyResearch ?? null,
  });

  revalidatePath(`/dashboard/applications/${applicationId}/edit`);
  return undefined;
}

// Plain helper (not a form action) for the structured content — the shape
// future AI generation (a later Milestone 4 batch) will populate. Throws
// on invalid input/ownership since there's no form calling this yet.
export async function setInterviewPrepStructuredData(
  applicationId: string,
  data: { likelyQuestions?: LikelyQuestion[]; starStories?: StarStory[] },
) {
  const userId = await requireUserId();

  const likelyQuestions =
    data.likelyQuestions !== undefined
      ? likelyQuestionsSchema.parse(data.likelyQuestions)
      : undefined;
  const starStories =
    data.starStories !== undefined
      ? starStoriesSchema.parse(data.starStories)
      : undefined;

  if (!(await assertApplicationOwnership(applicationId, userId))) {
    throw new Error("Application not found.");
  }

  const result = await upsertInterviewPrep(userId, applicationId, {
    ...(likelyQuestions !== undefined ? { likelyQuestions } : {}),
    ...(starStories !== undefined ? { starStories } : {}),
  });

  revalidatePath(`/dashboard/applications/${applicationId}/edit`);
  return result;
}

// Fetch helper scoped to the signed-in user — returns null if no prep
// record exists yet, or if the application isn't owned by this user.
export async function getInterviewPrep(applicationId: string) {
  const userId = await requireUserId();
  return prisma.interviewPrep.findFirst({
    where: { applicationId, userId },
  });
}

// Form action backing the interview-prep page: saves all four fields in
// one submit. likelyQuestions/starStories arrive as JSON strings (from
// hidden inputs the client form keeps in sync with its row editor) rather
// than indexed form fields, since their shape is a variable-length list of
// small objects — this is a full replace of each list on every save, not a
// partial update (unlike setInterviewPrepStructuredData above, which is
// left untouched for future partial/AI-driven writes).
export async function updateInterviewPrep(
  applicationId: string,
  _prevState: InterviewPrepActionState,
  formData: FormData,
): Promise<InterviewPrepActionState> {
  const userId = await requireUserId();

  const textParsed = interviewPrepTextInputSchema.safeParse({
    prepNotes: formData.get("prepNotes"),
    companyResearch: formData.get("companyResearch"),
  });
  if (!textParsed.success) {
    return { error: textParsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let likelyQuestions: LikelyQuestion[] | undefined;
  let starStories: StarStory[] | undefined;
  try {
    const rawQuestions = formData.get("likelyQuestionsJson");
    if (typeof rawQuestions === "string" && rawQuestions.trim()) {
      likelyQuestions = likelyQuestionsSchema.parse(JSON.parse(rawQuestions));
    }
    const rawStories = formData.get("starStoriesJson");
    if (typeof rawStories === "string" && rawStories.trim()) {
      starStories = starStoriesSchema.parse(JSON.parse(rawStories));
    }
  } catch {
    return {
      error: "One of the interview questions or STAR stories is invalid.",
    };
  }

  if (!(await assertApplicationOwnership(applicationId, userId))) {
    return { error: "Application not found." };
  }

  await upsertInterviewPrep(userId, applicationId, {
    prepNotes: textParsed.data.prepNotes ?? null,
    companyResearch: textParsed.data.companyResearch ?? null,
    ...(likelyQuestions !== undefined ? { likelyQuestions } : {}),
    ...(starStories !== undefined ? { starStories } : {}),
  });

  revalidatePath(`/dashboard/applications/${applicationId}/interview-prep`);
  return undefined;
}

export type GenerateInterviewPrepState =
  | { error: string }
  | {
      likelyQuestions: LikelyQuestion[];
      companyResearch: string;
      starStoryPrompts: StarStory[];
    }
  | undefined;

// AI generation action. Deliberately does NOT write to the database itself
// — it returns generated content for the client form to merge into its
// editable state (see interview-prep-form.tsx), so nothing is persisted
// until the user reviews it and clicks the existing "Save interview prep"
// button. That keeps this a non-destructive, opt-in enhancement of manual
// editing rather than a second, competing write path.
export async function generateInterviewPrepContent(
  applicationId: string,
  _prevState: GenerateInterviewPrepState,
  _formData: FormData,
): Promise<GenerateInterviewPrepState> {
  const userId = await requireUserId();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: { resume: { select: { content: true } } },
  });
  if (!application) {
    return { error: "Application not found." };
  }

  const existingPrep = await prisma.interviewPrep.findFirst({
    where: { applicationId, userId },
  });

  try {
    const generated = await generateInterviewPrep({
      company: application.company,
      role: application.role,
      status: application.status,
      jobDescription: application.jobDescription ?? undefined,
      resumeContent: application.resume?.content ?? undefined,
      existingPrepNotes: existingPrep?.prepNotes ?? undefined,
      existingCompanyResearch: existingPrep?.companyResearch ?? undefined,
    });

    // Re-validate the AI's output with the same schemas that guard
    // manually-entered data — a strict response schema on the OpenAI side
    // is not a substitute for validating on receipt.
    const likelyQuestions = likelyQuestionsSchema.parse(
      generated.likelyQuestions,
    );
    const starStoryPrompts = starStoriesSchema.parse(
      generated.starStoryPrompts,
    );
    const companyResearch = generatedCompanyResearchSchema.parse(
      generated.companyResearch,
    );

    return { likelyQuestions, companyResearch, starStoryPrompts };
  } catch (error) {
    console.error("Interview prep generation failed:", error);
    return {
      error: "Could not generate interview prep. Please try again.",
    };
  }
}
