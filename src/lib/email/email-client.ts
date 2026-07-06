import { Resend } from "resend";

let client: Resend | undefined;

// Server-only: never import this from a Client Component. Lazily
// constructed so a missing API key only errors when an email is actually
// sent, not at module load / build time — mirrors src/lib/ai/openai-client.ts.
export function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  client ??= new Resend(apiKey);
  return client;
}
