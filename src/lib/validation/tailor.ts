import { z } from "zod";
import { structuredResumeSchema } from "@/lib/validation/resume-structured";

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
  // Structured resume + scores from the tailoring pipeline, passed through
  // hidden fields. All optional so a hand-pasted draft can still be saved.
  structuredJson: z
    .string()
    .transform((value, ctx) => {
      if (!value.trim()) return null;
      try {
        return structuredResumeSchema.parse(JSON.parse(value));
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid structured data." });
        return z.NEVER;
      }
    })
    .optional()
    .nullable(),
  matchScore: z.coerce.number().int().min(0).max(100).optional().catch(undefined),
  baseScore: z.coerce.number().int().min(0).max(100).optional().catch(undefined),
});

export type SaveTailoredResumeInput = z.infer<typeof saveTailoredResumeSchema>;
