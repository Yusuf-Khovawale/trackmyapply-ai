"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  tailorInputSchema,
  saveTailoredResumeSchema,
} from "@/lib/validation/tailor";
import { tailorResume } from "@/lib/ai/tailor-resume";

export type TailorState = { error: string } | { draft: string } | undefined;

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

  // Both lookups are scoped by userId so this can never read another
  // user's application or resume, even with a tampered resumeId.
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

  try {
    const draft = await tailorResume({
      company: application.company,
      role: application.role,
      jobDescription: application.jobDescription,
      resumeTitle: resume.title,
      resumeContent: resume.content,
    });
    return { draft };
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
  redirect(`/dashboard/resumes/${newResume.id}/edit`);
}
