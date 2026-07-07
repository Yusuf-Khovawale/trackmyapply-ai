import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { UnsubscribeConfirm } from "./unsubscribe-confirm";

// Public page — deliberately outside any auth-gated route. The recipient
// clicking this link from an email may not be signed in on this device;
// the signed token itself is the authorization, scoped to exactly one
// effect (disabling emailRemindersEnabled), not a general sign-in.
//
// The GET render only *validates* the token and shows a confirm button —
// the actual unsubscribe happens in a POST server action, so link
// prefetchers and email-security scanners can't trigger it.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const isValid = token ? verifyUnsubscribeToken(token) !== null : false;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass-card w-full max-w-sm p-8 text-center">
        {isValid && token ? (
          <UnsubscribeConfirm token={token} />
        ) : (
          <p className="font-medium text-zinc-50">
            This unsubscribe link is invalid.
          </p>
        )}
      </div>
    </div>
  );
}
