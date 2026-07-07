import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/auth/password-reset-token";
import { ResetForm } from "./reset-form";

// Public page — the recipient clicking this link from an email is not signed
// in; the signed-in-the-URL token is the authorization. The GET render only
// *validates* the token (a read: looks it up by hash, checks expiry) and
// shows the form. The actual password change happens in a POST server
// action, so link prefetchers / email-security scanners can't consume the
// token just by following the link.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let isValid = false;
  if (token) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: { expires: true },
    });
    isValid = !!record && record.expires.getTime() >= Date.now();
  }

  if (!token || !isValid) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="font-medium text-zinc-50">
          This reset link is invalid or has expired.
        </p>
        <p className="text-sm text-zinc-400">
          <Link href="/forgot-password" className="font-medium text-zinc-50">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return <ResetForm token={token} />;
}
