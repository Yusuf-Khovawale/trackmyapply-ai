import OpenAI from "openai";

let client: OpenAI | undefined;

// Server-only: never import this from a Client Component. Lazily
// constructed so a missing API key only errors when an AI feature is
// actually used, not at module load / build time.
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  client ??= new OpenAI({ apiKey });
  return client;
}
