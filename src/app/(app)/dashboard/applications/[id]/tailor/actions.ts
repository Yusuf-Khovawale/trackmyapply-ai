"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  tailorInputSchema,
  saveTailoredResumeSchema,
} from "@/lib/validation/tailor";
import { runTailorPipeline } from "@/lib/ai/tailor-resume";
import { generateCoverLetter } from "@/lib/ai/cover-letter";
import type { StructuredResume } from "@/lib/validation/resume-structured";
import type { Prisma } from "@/generated/prisma/client";

export type TailorState =
  | { error: string }
  | {
      draft: string;
      structured: StructuredResume;
      matchScore: number;
      baseScore: number;
      matched: string[];
      missing: string[];
      attempts: number;
    }
  | undefined;

export async function generateTailoredDraft(
  applicationId: string,
  _prevState: TailorState,
  formData: FormData,
): Promise<TailorState> {
  const userId = await requireUserId();

  const parsed = tailorInputSchema.safeParse({
    resumeId: formData.get("resumeId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // All lookups scoped by userId so this can never read another user's
  // application, resume, or profile.
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) {
    return { error: "Application not found." };
  }
  if (!application.jobDescription) {
    return { error: "This application has no job description saved yet." };
  }

  const resume = await prisma.resume.findFirst({
    where: { id: parsed.data.resumeId, userId },
  });
  if (!resume) {
    return { error: "Selected resume not found." };
  }
  if (!resume.content) {
    return { error: "That resume has no content saved yet." };
  }

  const [profile, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  try {
    const result = await runTailorPipeline({
      company: application.company,
      role: application.role,
      jobDescription: application.jobDescription,
      baseResumeTitle: resume.title,
      baseResumeContent: resume.content,
      profile: profile ? { ...profile, email: user?.email } : { email: user?.email },
    });
    return {
      draft: result.text,
      structured: result.structured,
      matchScore: result.matchScore,
      baseScore: result.baseScore,
      matched: result.report.matched,
      missing: result.report.missing,
      attempts: result.attempts,
    };
  } catch (error) {
    console.error("Resume tailoring failed:", error);
    return { error: "Could not generate a tailored draft. Please try again." };
  }
}

export type SaveTailorState = { error: string } | undefined;

export async function saveTailoredResume(
  applicationId: string,
  _prevState: SaveTailorState,
  formData: FormData,
): Promise<SaveTailorState> {
  const userId = await requireUserId();

  const parsed = saveTailoredResumeSchema.safeParse({
    draft: formData.get("draft"),
    baseResumeId: formData.get("baseResumeId"),
    linkToApplication: formData.get("linkToApplication"),
    structuredJson: formData.get("structuredJson"),
    matchScore: formData.get("matchScore") ?? undefined,
    baseScore: formData.get("baseScore") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Re-verified here rather than trusted from the earlier generate step —
  // this action can be invoked independently, so it re-checks both the
  // application and the base resume belong to the signed-in user.
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) {
    return { error: "Application not found." };
  }

  const baseResume = await prisma.resume.findFirst({
    where: { id: parsed.data.baseResumeId, userId },
  });
  if (!baseResume) {
    return { error: "Base resume not found." };
  }

  const newResume = await prisma.resume.create({
    data: {
      userId,
      title: `${baseResume.title} (tailored)`,
      versionLabel: `Tailored for ${application.company} — ${application.role}`,
      baseRole: baseResume.baseRole ?? application.role,
      content: parsed.data.draft,
      notes: `Tailored from "${baseResume.title}" for the ${application.role} role at ${application.company}.`,
      structured:
        (parsed.data.structuredJson as Prisma.InputJsonValue | null) ?? undefined,
      matchScore: parsed.data.matchScore ?? null,
      baseScore: parsed.data.baseScore ?? null,
    },
  });

  if (parsed.data.linkToApplication) {
    await prisma.application.updateMany({
      where: { id: applicationId, userId },
      data: { resumeId: newResume.id },
    });
  }

  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard");
  redirect(`/dashboard/resumes/${newResume.id}/print`);
}

export type CoverLetterState =
  | { error: string }
  | { letter: string }
  | undefined;

export async function generateCoverLetterAction(
  applicationId: string,
  _prevState: CoverLetterState,
  formData: FormData,
): Promise<CoverLetterState> {
  const userId = await requireUserId();

  const resumeText = String(formData.get("resumeText") ?? "").trim();
  if (!resumeText) {
    return { error: "Generate or select a resume first." };
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
  });
  if (!application) {
    return { error: "Application not found." };
  }
  if (!application.jobDescription) {
    return { error: "This application has no job description saved yet." };
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });

  try {
    const letter = await generateCoverLetter({
      company: application.company,
      role: application.role,
      jobDescription: application.jobDescription,
      resumeText: resumeText.slice(0, 20000),
      candidateName: profile?.fullName,
    });

    await prisma.application.updateMany({
      where: { id: applicationId, userId },
      data: { coverLetter: letter },
    });

    revalidatePath(`/dashboard/applications/${applicationId}/tailor`);
    return { letter };
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    return { error: "Could not generate a cover letter. Please try again." };
  }
}
