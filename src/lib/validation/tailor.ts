import { z } from "zod";

export const tailorInputSchema = z.object({
  resumeId: z.string().trim().min(1, "Select a resume."),
});

export type TailorInput = z.infer<typeof tailorInputSchema>;

export const saveTailoredResumeSchema = z.object({
  draft: z.string().trim().min(1, "No tailored draft to save.").max(20000),
  baseResumeId: z.string().trim().min(1, "Base resume is required."),
  linkToApplication: z.preprocess(
    (value) => value === "true" || value === "on",
    z.boolean(),
  ),
});

export type SaveTailoredResumeInput = z.infer<typeof saveTailoredResumeSchema>;
