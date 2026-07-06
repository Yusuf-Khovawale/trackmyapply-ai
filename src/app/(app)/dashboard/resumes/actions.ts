"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { resumeInputSchema } from "@/lib/validation/resume";

export type ActionState = { error?: string } | undefined;

function parseResumeFormData(formData: FormData) {
  return resumeInputSchema.safeParse({
    title: formData.get("title"),
    versionLabel: formData.get("versionLabel"),
    baseRole: formData.get("baseRole"),
    fileUrl: formData.get("fileUrl"),
    content: formData.get("content"),
    notes: formData.get("notes"),
  });
}

export async function createResume(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseResumeFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.resume.create({
    data: {
      ...parsed.data,
      userId,
    },
  });

  revalidatePath("/dashboard/resumes");
  redirect("/dashboard/resumes");
}

export async function updateResume(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseResumeFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // updateMany scoped by (id, userId) so a user can never mutate another
  // user's resume, even by guessing an id.
  const result = await prisma.resume.updateMany({
    where: { id, userId },
    data: parsed.data,
  });

  if (result.count === 0) {
    return { error: "Resume not found." };
  }

  revalidatePath("/dashboard/resumes");
  redirect("/dashboard/resumes");
}

export async function deleteResume(id: string) {
  const userId = await requireUserId();

  // No manual cleanup needed for applications referencing this resume:
  // Application.resumeId has onDelete: SetNull at the database level, so
  // the FK constraint clears the reference automatically.
  const result = await prisma.resume.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return { error: "Resume not found." };
  }

  revalidatePath("/dashboard/resumes");
  revalidatePath("/dashboard");
  return { success: true as const };
}
