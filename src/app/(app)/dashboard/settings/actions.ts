"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";

const REMINDER_EMAIL_FREQUENCIES = ["IMMEDIATE", "DAILY_DIGEST"] as const;

export async function updateEmailReminderPreference(formData: FormData) {
  const userId = await requireUserId();
  const enabled = formData.get("emailRemindersEnabled") === "on";
  const rawFrequency = formData.get("reminderEmailFrequency");
  const frequency = REMINDER_EMAIL_FREQUENCIES.includes(
    rawFrequency as (typeof REMINDER_EMAIL_FREQUENCIES)[number],
  )
    ? (rawFrequency as (typeof REMINDER_EMAIL_FREQUENCIES)[number])
    : "IMMEDIATE";

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailRemindersEnabled: enabled,
      reminderEmailFrequency: frequency,
    },
  });

  revalidatePath("/dashboard/settings");
}
