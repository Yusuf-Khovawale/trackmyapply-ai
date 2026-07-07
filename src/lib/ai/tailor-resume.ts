import { getOpenAIClient } from "@/lib/ai/openai-client";
import { parseModelJson } from "@/lib/ai/json-utils";
import {
  structuredResumeSchema,
  type StructuredResume,
} from "@/lib/validation/resume-structured";
import {
  extractJdKeywords,
  scoreResumeAgainstKeywords,
  type AtsScoreReport,
  type JdKeyword,
} from "@/lib/ai/ats-score";
import { structuredToPlainText } from "@/lib/resume-render";

const DEFAULT_MODEL = "gpt-5.4-mini";
// The pipeline keeps revising until the draft clears this ATS coverage
// score (or runs out of attempts) — the user's stated bar is 90-95%.
const TARGET_SCORE = 92;
const MAX_ATTEMPTS = 3;

export type CandidateProfileInput = {
  fullName?: string | null;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  summary?: string | null;
  skills?: string | null;
  experience?: string | null;
  education?: string | null;
  projects?: string | null;
  certifications?: string | null;
  email?: string | null;
};

export type TailorPipelineInput = {
  company: string;
  role: string;
  jobDescription: string;
  baseResumeTitle: string;
  baseResumeContent: string;
  profile?: CandidateProfileInput | null;
};

export type TailorPipelineResult = {
  structured: StructuredResume;
  text: string;
  matchScore: number;
  baseScore: number;
  report: AtsScoreReport;
  attempts: number;
};

function profileBlock(profile: CandidateProfileInput | null | undefined): string {
  if (!profile) return "";
  const lines: string[] = [];
  const push = (label: string, value?: string | null) => {
    if (value?.trim()) lines.push(`${label}: ${value.trim()}`);
  };
  push("Full name", profile.fullName);
  push("Email", profile.email);
  push("Headline", profile.headline);
  push("Phone", profile.phone);
  push("Location", profile.location);
  push("LinkedIn", profile.linkedinUrl);
  push("GitHub", profile.githubUrl);
  push("Portfolio", profile.portfolioUrl);
  push("Professional summary", profile.summary);
  push("Skills", profile.skills);
  push("Experience", profile.experience);
  push("Education", profile.education);
  push("Projects", profile.projects);
  push("Certifications", profile.certifications);
  return lines.length > 0
    ? `Candidate profile (additional truthful source material):\n${lines.join("\n")}\n\n`
    : "";
}

const GENERATION_INSTRUCTIONS =
  "You are an expert resume writer and honest career mentor. Build the " +
  "strongest possible resume for the target job using ONLY facts present " +
  "in the candidate's base resume and profile. Never invent employers, " +
  "titles, dates, degrees, certifications, or skills the candidate does " +
  "not have. You MAY: reorder and reprioritize content, rewrite bullets " +
  "with strong action verbs and quantified impact (only numbers already " +
  "present or clearly derivable), mirror the job description's exact " +
  "terminology for skills the candidate genuinely has (e.g. if they know " +
  '"React" and the JD says "React.js", write "React.js"), and surface ' +
  "transferable experience. Target a single-page, ATS-friendly resume. " +
  "Return STRICT JSON only (no markdown fences, no prose) with this " +
  "shape: {contact:{name,email,phone,location,linkedin,github,portfolio}," +
  "headline,summary,skills:[{category,items:[]}],experience:[{title," +
  "company,location,dates,bullets:[]}],projects:[{name,tech,bullets:[]}]," +
  "education:[{degree,school,dates,details}],certifications:[]}";

async function generateDraft(
  input: TailorPipelineInput,
  keywords: JdKeyword[],
  previous?: { draft: StructuredResume; report: AtsScoreReport },
): Promise<StructuredResume> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const keywordHint =
    "ATS keywords to cover where truthful (weight 3 = required): " +
    keywords
      .map((keyword) => `${keyword.term} (w${keyword.weight})`)
      .join(", ");

  const revisionBlock = previous
    ? "\n\nREVISION PASS. Previous draft scored " +
      `${previous.report.score}/100 on ATS keyword coverage. Keywords still ` +
      `missing: ${previous.report.missing.join(", ") || "none"}. For each ` +
      "missing keyword the candidate genuinely has evidence for in the " +
      "source material, work the exact term into skills or bullets. If the " +
      "candidate has NO evidence for a keyword, leave it out — do not " +
      "fabricate. Previous draft JSON:\n" +
      JSON.stringify(previous.draft)
    : "";

  const response = await client.responses.create({
    model,
    temperature: 0.2,
    instructions: GENERATION_INSTRUCTIONS,
    input:
      `Target company: ${input.company}\n` +
      `Target role: ${input.role}\n\n` +
      `Job description:\n${input.jobDescription}\n\n` +
      `${keywordHint}\n\n` +
      profileBlock(input.profile) +
      `Base resume ("${input.baseResumeTitle}"):\n${input.baseResumeContent}` +
      revisionBlock,
  });

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new Error("No tailored draft was returned.");
  }
  return structuredResumeSchema.parse(parseModelJson(raw));
}

// The full generate → score → revise pipeline. Scores are deterministic
// keyword-coverage numbers against a single extracted keyword set, so the
// base-vs-tailored comparison is apples to apples.
export async function runTailorPipeline(
  input: TailorPipelineInput,
): Promise<TailorPipelineResult> {
  const keywords = await extractJdKeywords(input.jobDescription);

  const baseReport = scoreResumeAgainstKeywords(
    input.baseResumeContent,
    keywords,
  );

  let best: { draft: StructuredResume; report: AtsScoreReport } | null = null;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    const draft = await generateDraft(input, keywords, best ?? undefined);
    const report = scoreResumeAgainstKeywords(
      structuredToPlainText(draft),
      keywords,
    );
    if (!best || report.score > best.report.score) {
      best = { draft, report };
    }
    if (best.report.score >= TARGET_SCORE) {
      break;
    }
  }

  if (!best) {
    throw new Error("Tailoring failed to produce a draft.");
  }

  return {
    structured: best.draft,
    text: structuredToPlainText(best.draft),
    matchScore: best.report.score,
    baseScore: baseReport.score,
    report: best.report,
    attempts,
  };
}
