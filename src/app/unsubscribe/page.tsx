import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

// Public page — deliberately outside any auth-gated route. The recipient
// clicking this link from an email may not be signed in on this device;
// the signed token itself is the authorization, scoped to exactly one
// effect (disabling emailRemindersEnabled), not a general sign-in.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const userId = token ? verifyUnsubscribeToken(token) : null;

  if (userId) {
    // updateMany (not update) so an already-unsubscribed account or a
    // re-click is a harmless no-op rather than an error.
    await prisma.user.updateMany({
      where: { id: userId },
      data: { emailRemindersEnabled: false },
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-black/[.08] p-8 text-center dark:border-white/[.145]">
        <p className="text-black dark:text-zinc-50">
          {userId
            ? "You've been unsubscribed from reminder emails."
            : "This unsubscribe link is invalid."}
        </p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          You can re-enable them anytime in{" "}
          <Link href="/dashboard/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
