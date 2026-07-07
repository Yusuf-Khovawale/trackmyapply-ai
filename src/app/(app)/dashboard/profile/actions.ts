"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { profileInputSchema } from "@/lib/validation/profile";

export type ProfileActionState = { error?: string } | undefined;

export async function saveProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userId = await requireUserId();

  const parsed = profileInputSchema.safeParse({
    fullName: formData.get("fullName"),
    headline: formData.get("headline"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    linkedinUrl: formData.get("linkedinUrl"),
    githubUrl: formData.get("githubUrl"),
    portfolioUrl: formData.get("portfolioUrl"),
    summary: formData.get("summary"),
    skills: formData.get("skills"),
    experience: formData.get("experience"),
    education: formData.get("education"),
    projects: formData.get("projects"),
    certifications: formData.get("certifications"),
    targetRoles: formData.get("targetRoles"),
    targetLocations: formData.get("targetLocations"),
    workPreference: formData.get("workPreference"),
    experienceLevel: formData.get("experienceLevel"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [key, value ?? null]),
  );

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data, onboardedAt: new Date() },
    update: { ...data, onboardedAt: new Date() },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
