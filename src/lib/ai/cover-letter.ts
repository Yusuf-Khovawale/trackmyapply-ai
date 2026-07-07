import { getOpenAIClient } from "@/lib/ai/openai-client";

const DEFAULT_MODEL = "gpt-5.4-mini";

export type CoverLetterInput = {
  company: string;
  role: string;
  jobDescription: string;
  resumeText: string;
  candidateName?: string | null;
};

// One distinct, independently testable function per AI feature — this is
// the "cover letter" feature.
export async function generateCoverLetter(
  input: CoverLetterInput,
): Promise<string> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    temperature: 0.4,
    instructions:
      "You write concise, specific, professional cover letters. Use only " +
      "facts from the candidate's resume — never invent experience. " +
      "Structure: a strong opening tying the candidate to this specific " +
      "role and company, one or two short paragraphs connecting their most " +
      "relevant achievements to the job description's needs, and a brief, " +
      "confident close. 250-350 words. No address blocks or dates — just " +
      'the letter body starting with "Dear Hiring Manager," (or the ' +
      "hiring team) and ending with a signature line using the candidate's " +
      "name. Plain text only.",
    input:
      `Company: ${input.company}\nRole: ${input.role}\n` +
      (input.candidateName ? `Candidate name: ${input.candidateName}\n` : "") +
      `\nJob description:\n${input.jobDescription}\n\n` +
      `Candidate resume:\n${input.resumeText}`,
  });

  const letter = response.output_text?.trim();
  if (!letter) {
    throw new Error("No cover letter was returned.");
  }
  return letter;
}
