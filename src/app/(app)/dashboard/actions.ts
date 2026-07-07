"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  applicationInputSchema,
  applicationStatusSchema,
} from "@/lib/validation/application";
import { ensureAutoTaskForStatus } from "@/lib/auto-tasks";

export type ActionState = { error?: string } | undefined;

function parseApplicationFormData(formData: FormData) {
  return applicationInputSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    jobUrl: formData.get("jobUrl"),
    source: formData.get("source"),
    status: formData.get("status"),
    dateApplied: formData.get("dateApplied"),
    resumeVersion: formData.get("resumeVersion"),
    resumeId: formData.get("resumeId"),
    followUpDate: formData.get("followUpDate"),
    notes: formData.get("notes"),
    jobDescription: formData.get("jobDescription"),
  });
}

// A resumeId submitted by the client is untrusted input — confirm it's
// actually one of this user's resumes before linking it, so a tampered
// select value can never attach another user's resume to an application.
async function assertResumeOwnership(userId: string, resumeId: string | undefined) {
  if (!resumeId) return true;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  });
  return !!resume;
}

export async function createApplication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseApplicationFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { dateApplied, followUpDate, resumeId, jobDescription, ...rest } =
    parsed.data;

  if (!(await assertResumeOwnership(userId, resumeId))) {
    return { error: "Selected resume not found." };
  }

  const created = await prisma.application.create({
    data: {
      ...rest,
      userId,
      resumeId: resumeId ?? null,
      jobDescription: jobDescription ?? null,
      dateApplied: dateApplied ? new Date(dateApplied) : null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  // Mentor behavior: every new application gets its next-step reminder
  // automatically (apply / follow up / prep, depending on status).
  await ensureAutoTaskForStatus(
    userId,
    created.id,
    created.company,
    created.status,
  );

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateApplication(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseApplicationFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { dateApplied, followUpDate, resumeId, jobDescription, ...rest } =
    parsed.data;

  if (!(await assertResumeOwnership(userId, resumeId))) {
    return { error: "Selected resume not found." };
  }

  // updateMany scoped by (id, userId) so a user can never mutate another
  // user's application, even by guessing an id. resumeId/jobDescription are
  // set explicitly (not spread) so clearing them in the form actually clears
  // them in the database, rather than Prisma treating `undefined` as "leave
  // unchanged" (which is what we rely on for the legacy resumeVersion field).
  const result = await prisma.application.updateMany({
    where: { id, userId },
    data: {
      ...rest,
      resumeId: resumeId ?? null,
      jobDescription: jobDescription ?? null,
      dateApplied: dateApplied ? new Date(dateApplied) : null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  if (result.count === 0) {
    return { error: "Application not found." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateApplicationStatus(id: string, status: string) {
  const userId = await requireUserId();
  const parsedStatus = applicationStatusSchema.safeParse(status);

  if (!parsedStatus.success) {
    return { error: "Invalid status." };
  }

  const result = await prisma.application.updateMany({
    where: { id, userId },
    data: { status: parsedStatus.data },
  });

  if (result.count === 0) {
    return { error: "Application not found." };
  }

  // Mentor behavior: a status change spawns the next-step reminder
  // automatically (e.g. APPLIED -> follow-up, INTERVIEW -> prep).
  const application = await prisma.application.findFirst({
    where: { id, userId },
    select: { company: true },
  });
  if (application) {
    await ensureAutoTaskForStatus(
      userId,
      id,
      application.company,
      parsedStatus.data,
    );
  }

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function deleteApplication(id: string) {
  const userId = await requireUserId();

  const result = await prisma.application.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return { error: "Application not found." };
  }

  revalidatePath("/dashboard");
  return { success: true as const };
}
