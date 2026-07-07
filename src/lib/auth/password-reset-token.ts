import { randomBytes, createHash } from "crypto";

// Password reset tokens.
//
// The raw token is a 32-byte random value, base64url-encoded, that travels
// ONLY in the emailed link. What we persist in the database is its SHA-256
// hash — so a database leak yields hashes, not usable reset links (the same
// reasoning behind never storing a raw password). SHA-256 (not bcrypt) is
// appropriate here: the token is high-entropy random, so there's nothing to
// brute-force, and lookups must be fast/deterministic.
//
// Tokens are single-use and short-lived; see resetPassword for consumption.

const TOKEN_BYTES = 32;

// How long a reset link stays valid. Short enough to limit exposure if an
// email account is briefly compromised, long enough that a user can act on
// it at their own pace.
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}
