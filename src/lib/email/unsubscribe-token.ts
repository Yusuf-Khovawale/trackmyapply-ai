import { createHmac, timingSafeEqual } from "crypto";

// Namespaced so this signature can never be confused with any other value
// signed with AUTH_SECRET elsewhere in the app (domain separation) — reuses
// the app's existing required secret rather than adding a new one, since
// the worst case of a forged token (someone else gets unsubscribed from
// reminder emails) is low severity, not a session/account compromise.
const NAMESPACE = "reminder-unsubscribe:";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return secret;
}

function sign(userId: string): string {
  return createHmac("sha256", getSecret())
    .update(NAMESPACE + userId)
    .digest("base64url");
}

// Stateless, non-expiring token: `${userId}.${signature}`. Unsubscribe
// links are expected to work indefinitely (standard practice), so there's
// no expiry — only the signature check guards it.
export function createUnsubscribeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) {
    return null;
  }

  const userId = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const expectedSignature = sign(userId);

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  return userId;
}
