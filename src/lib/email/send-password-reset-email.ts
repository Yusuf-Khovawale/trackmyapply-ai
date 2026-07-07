import { getEmailClient } from "@/lib/email/email-client";

export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  // Minutes until the link expires — surfaced in the copy so the recipient
  // knows to act promptly.
  expiresInMinutes: number;
};

// Reuses REMINDER_EMAIL_FROM (the app's one verified sender) so no new env
// var is required to send password resets; falls back to the same default.
const FROM_ADDRESS =
  process.env.PASSWORD_RESET_EMAIL_FROM ||
  process.env.REMINDER_EMAIL_FROM ||
  "GetHired AI <no-reply@trackmyapply.app>";

// One distinct, independently testable function per email type (matches the
// reminder-email convention — see src/lib/email/send-reminder-email.ts):
// composes and sends exactly one password-reset email. Plain text only,
// restrained copy — what happened, the link, when it expires, and a note
// for people who didn't request it.
export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
): Promise<void> {
  const client = getEmailClient();

  const text =
    `We received a request to reset the password for your GetHired AI account.\n\n` +
    `Reset your password: ${input.resetUrl}\n\n` +
    `This link expires in ${input.expiresInMinutes} minutes and can be used once.\n\n` +
    `If you didn't request this, you can safely ignore this email — your ` +
    `password won't change until you open the link above and set a new one.`;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: "Reset your GetHired AI password",
    text,
  });
}
