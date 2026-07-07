import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { parseModelJson } from "@/lib/ai/json-utils";

const DEFAULT_MODEL = "gpt-5.4-mini";

// A weighted keyword/requirement extracted from a job description.
// weight: 3 = must-have, 2 = strongly desired, 1 = nice-to-have.
export type JdKeyword = {
  term: string;
  weight: number;
  aliases: string[];
};

const keywordListSchema = z.array(
  z.object({
    term: z.string().min(1),
    weight: z.number().int().min(1).max(3).catch(2),
    aliases: z.array(z.string()).catch([]),
  }),
);

// Extract the ATS-relevant keywords from a JD once per pipeline run; the
// deterministic scorer below reuses them for every draft iteration so the
// score is stable and comparable between base and tailored resumes.
export async function extractJdKeywords(
  jobDescription: string,
): Promise<JdKeyword[]> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    temperature: 0,
    instructions:
      "You are an ATS (applicant tracking system) keyword analyst. Extract " +
      "the concrete skills, technologies, tools, methodologies, " +
      "certifications, and role-specific competencies a resume screener " +
      "would look for in this job description. Return STRICT JSON only: an " +
      'array of objects {"term": string, "weight": 1|2|3, "aliases": ' +
      'string[]}. weight 3 = explicitly required, 2 = strongly desired, ' +
      "1 = nice-to-have. aliases are common equivalent spellings or " +
      'abbreviations (e.g. "JavaScript" -> ["JS", "ECMAScript"]). Extract ' +
      "15-30 keywords. No prose, no markdown fences — JSON array only.",
    input: jobDescription,
  });

  const parsed = keywordListSchema.parse(parseModelJson(response.output_text ?? "[]"));
  // De-duplicate by lowercase term, keeping the highest weight.
  const byTerm = new Map<string, JdKeyword>();
  for (const keyword of parsed) {
    const key = keyword.term.toLowerCase();
    const existing = byTerm.get(key);
    if (!existing || keyword.weight > existing.weight) {
      byTerm.set(key, keyword);
    }
  }
  return [...byTerm.values()];
}

export type AtsScoreReport = {
  score: number;
  matched: string[];
  missing: string[];
  missingMustHaves: string[];
};

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ")} `;
}

function containsTerm(haystack: string, term: string): boolean {
  const needle = ` ${term.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim()} `;
  return needle.trim().length > 0 && haystack.includes(needle);
}

// Deterministic weighted-coverage score (0-100): what fraction of the JD's
// weighted keywords appear in the resume text (term or any alias). This is
// an honest ATS-style coverage measure — it cannot and does not claim to
// predict hiring outcomes by itself.
export function scoreResumeAgainstKeywords(
  resumeText: string,
  keywords: JdKeyword[],
): AtsScoreReport {
  const haystack = normalize(resumeText);
  let totalWeight = 0;
  let matchedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  const missingMustHaves: string[] = [];

  for (const keyword of keywords) {
    totalWeight += keyword.weight;
    const candidates = [keyword.term, ...keyword.aliases];
    const hit = candidates.some((candidate) => containsTerm(haystack, candidate));
    if (hit) {
      matchedWeight += keyword.weight;
      matched.push(keyword.term);
    } else {
      missing.push(keyword.term);
      if (keyword.weight === 3) {
        missingMustHaves.push(keyword.term);
      }
    }
  }

  const score =
    totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 100);
  return { score, matched, missing, missingMustHaves };
}
