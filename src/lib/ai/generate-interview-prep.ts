import { getOpenAIClient } from "@/lib/ai/openai-client";

const DEFAULT_MODEL = "gpt-5.4-mini";

export type GenerateInterviewPrepInput = {
  company: string;
  role: string;
  status: string;
  jobDescription?: string;
  resumeContent?: string;
  existingPrepNotes?: string;
  existingCompanyResearch?: string;
};

export type GeneratedInterviewPrep = {
  likelyQuestions: { question: string; notes?: string }[];
  companyResearch: string;
  starStoryPrompts: { title: string }[];
};

// Strict JSON Schema for the Responses API's Structured Outputs — the model
// is constrained to return exactly this shape, rather than relying on
// prompt instructions alone. `notes` must be nullable (not just optional)
// because strict mode requires every property to appear in `required`.
const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    likelyQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          notes: { type: ["string", "null"] },
        },
        required: ["question", "notes"],
        additionalProperties: false,
      },
    },
    companyResearch: { type: "string" },
    starStoryPrompts: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  required: ["likelyQuestions", "companyResearch", "starStoryPrompts"],
  additionalProperties: false,
} as const;

type RawGeneratedInterviewPrep = {
  likelyQuestions: { question: string; notes: string | null }[];
  companyResearch: string;
  starStoryPrompts: { title: string }[];
};

// One distinct, independently testable function per AI feature, per
// docs/architecture.md §6 — this is the "interview prep generation" feature.
export async function generateInterviewPrep(
  input: GenerateInterviewPrepInput,
): Promise<GeneratedInterviewPrep> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    temperature: 0.3,
    instructions:
      "You are an interview preparation assistant for job seekers. Given a " +
      "target company, role, job description, and (if available) the " +
      "candidate's resume and existing prep notes, produce practical, " +
      "specific interview prep content grounded in those details — not " +
      "generic advice. Provide 5-8 likely questions mixing behavioral and " +
      "role/technical questions relevant to the job description. " +
      "companyResearch should be a few short paragraphs or bullet points " +
      "of company/role-specific prep points (not generic interview " +
      "advice). Provide 3-5 starStoryPrompts phrased as short STAR-story " +
      "prompts (titles only) the candidate can prepare an answer for — do " +
      "not write the stories themselves, only the prompts.",
    input:
      `Company: ${input.company}\n` +
      `Role: ${input.role}\n` +
      `Application status: ${input.status}\n\n` +
      (input.jobDescription
        ? `Job description:\n${input.jobDescription}\n\n`
        : "") +
      (input.resumeContent
        ? `Candidate's resume:\n${input.resumeContent}\n\n`
        : "") +
      (input.existingPrepNotes
        ? `Candidate's existing prep notes:\n${input.existingPrepNotes}\n\n`
        : "") +
      (input.existingCompanyResearch
        ? `Candidate's existing company research:\n${input.existingCompanyResearch}\n\n`
        : "") +
      "Generate interview prep content for this application.",
    text: {
      format: {
        type: "json_schema",
        name: "interview_prep",
        strict: true,
        schema: RESPONSE_JSON_SCHEMA,
      },
    },
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("No interview prep content was returned.");
  }

  const parsed = JSON.parse(text) as RawGeneratedInterviewPrep;

  return {
    likelyQuestions: parsed.likelyQuestions.map((q) => ({
      question: q.question,
      notes: q.notes ?? undefined,
    })),
    companyResearch: parsed.companyResearch,
    starStoryPrompts: parsed.starStoryPrompts,
  };
}
