import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === null || (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

// Editable-as-plain-text fields — the only surface a (future) simple form
// needs, until likelyQuestions/starStories get a dedicated structured UI.
export const interviewPrepTextInputSchema = z.object({
  prepNotes: optionalText(20000),
  companyResearch: optionalText(20000),
});

export type InterviewPrepTextInput = z.infer<
  typeof interviewPrepTextInputSchema
>;

export const likelyQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required.").max(500),
  notes: z.string().trim().max(2000).optional(),
  // Added in Milestone 4 Batch 4. `.default(false)` means rows saved before
  // this field existed still parse fine — Zod fills it in on read, so no
  // data migration is needed for this Json column.
  practiced: z.boolean().default(false),
});

export const likelyQuestionsSchema = z.array(likelyQuestionSchema).max(50);

export type LikelyQuestion = z.infer<typeof likelyQuestionSchema>;

export const starStorySchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  situation: z.string().trim().max(2000).optional(),
  task: z.string().trim().max(2000).optional(),
  action: z.string().trim().max(2000).optional(),
  result: z.string().trim().max(2000).optional(),
  // Added in Milestone 4 Batch 4 — same backward-compatible default as
  // `practiced` above.
  ready: z.boolean().default(false),
});

export const starStoriesSchema = z.array(starStorySchema).max(50);

export type StarStory = z.infer<typeof starStorySchema>;

// Validates AI-generated company research text before it's handed back to
// the client (see generateInterviewPrepContent in actions.ts).
export const generatedCompanyResearchSchema = z
  .string()
  .trim()
  .min(1, "No company research was generated.")
  .max(20000);
