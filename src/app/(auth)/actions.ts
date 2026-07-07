"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveAppBaseUrl } from "@/lib/app-url";
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
  RESET_TOKEN_TTL_MS,
} from "@/lib/auth/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    throw error;
  }
}

export async function registerAndSignIn(
  _prevState: string | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) {
    return "Email and password are required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  // bcrypt silently truncates at 72 bytes — reject longer passwords rather
  // than letting users believe more characters are being checked.
  if (password.length > 72) {
    return "Password must be at most 72 characters.";
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "An account with that email already exists.";
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name: name || null, hashedPassword },
  });

  try {
    // First login goes straight to profile onboarding — the AI mentor
    // needs the user's details before it can build or tailor anything.
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard/profile?welcome=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created. Please sign in.";
    }
    throw error;
  }
}

// Same generic confirmation regardless of whether the email is registered —
// so this endpoint can't be used to enumerate which emails have accounts.
export type ResetRequestState =
  | { status: "sent" }
  | { status: "error"; message: string }
  | undefined;

export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Only issue a token for a real account that actually has a password
  // (Credentials users). We still return the same "sent" acknowledgement in
  // every case so the response doesn't reveal whether the email exists.
  if (user?.hashedPassword) {
    const { token, tokenHash } = generateResetToken();

    // At most one live token per user: clear any prior (used or stale)
    // rows before inserting the new one, so an old link can't linger.
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expires: resetTokenExpiry() },
      }),
    ]);

    const resetUrl = `${resolveAppBaseUrl()}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        expiresInMinutes: Math.round(RESET_TOKEN_TTL_MS / 60000),
      });
    } catch (error) {
      // Don't leak delivery/config failures to the client (which would also
      // hint that the account exists). Log for operators; the user still
      // sees the generic acknowledgement.
      console.error("Failed to send password reset email:", error);
    }
  }

  return { status: "sent" };
}

export type ResetPasswordState =
  | { status: "invalid" }
  | { status: "error"; message: string }
  | { status: "done" }
  | undefined;

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { status: "invalid" };
  }

  // Same password rules as registration.
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }
  if (password.length > 72) {
    return { status: "error", message: "Password must be at most 72 characters." };
  }
  if (password !== confirm) {
    return { status: "error", message: "Passwords do not match." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });

  // Unknown or expired token → generic "invalid" so we don't distinguish
  // "never existed" from "expired". Clean up the expired row opportunistically.
  if (!record || record.expires.getTime() < Date.now()) {
    if (record) {
      await prisma.passwordResetToken.deleteMany({ where: { id: record.id } });
    }
    return { status: "invalid" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Consume the token atomically with the password update so a reset link
  // is strictly single-use. Deleting all of the user's tokens also
  // invalidates any other outstanding reset links.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { hashedPassword },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  // Require the user to sign in with the new password (proves they have it)
  // rather than auto-authenticating from the reset link.
  return { status: "done" };
}
