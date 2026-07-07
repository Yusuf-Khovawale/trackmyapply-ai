"use server";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

export type UnsubscribeState =
  | { status: "done" }
  | { status: "invalid" }
  | undefined;

// The mutation lives in a POST-only server action (not the page's GET
// render) so email scanners and link prefetchers that follow the link can
// never unsubscribe someone — only an explicit button press can.
export async function confirmUnsubscribe(
  _prevState: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  const token = formData.get("token");
  const userId =
    typeof token === "string" ? verifyUnsubscribeToken(token) : null;

  if (!userId) {
    return { status: "invalid" };
  }

  // updateMany (not update) so an already-unsubscribed account or a
  // re-click is a harmless no-op rather than an error.
  await prisma.user.updateMany({
    where: { id: userId },
    data: { emailRemindersEnabled: false },
  });

  return { status: "done" };
}
