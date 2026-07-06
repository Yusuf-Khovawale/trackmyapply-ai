import { getOpenAIClient } from "@/lib/ai/openai-client";

const DEFAULT_MODEL = "gpt-5.4-mini";

export type TailorResumeInput = {
  company: string;
  role: string;
  jobDescription: string;
  resumeTitle: string;
  resumeContent: string;
};

// One distinct, independently testable function per AI feature, per
// docs/architecture.md §6 — this is the "resume tailoring" feature.
export async function tailorResume(input: TailorResumeInput): Promise<string> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    temperature: 0.2,
    instructions:
      "You are a precise, honest resume-tailoring assistant for job seekers. " +
      "Rewrite the given resume to better match the target job, without " +
      "inventing experience, skills, or credentials the candidate does not " +
      "already have in the source resume. Keep the same overall structure " +
      "and factual claims; adjust emphasis, ordering, and wording to align " +
      "with the job description. Output plain text or simple markdown only " +
      "— no commentary before or after the resume itself.",
    input:
      `Target company: ${input.company}\n` +
      `Target role: ${input.role}\n\n` +
      `Job description:\n${input.jobDescription}\n\n` +
      `Base resume ("${input.resumeTitle}"):\n${input.resumeContent}\n\n` +
      "Produce a tailored version of this resume for this job.",
  });

  const draft = response.output_text?.trim();
  if (!draft) {
    throw new Error("No tailored draft was returned.");
  }
  return draft;
}
