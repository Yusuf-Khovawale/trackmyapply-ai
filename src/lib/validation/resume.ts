import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(500).url("Enter a valid URL").optional(),
);

export const resumeInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  versionLabel: optionalText(200),
  baseRole: optionalText(200),
  fileUrl: optionalUrl,
  content: optionalText(20000),
  notes: optionalText(2000),
});

export type ResumeInput = z.infer<typeof resumeInputSchema>;
