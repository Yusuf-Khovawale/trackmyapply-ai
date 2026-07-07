import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(500)
    .url("Enter a valid URL")
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "URL must start with http:// or https://",
    )
    .optional(),
);

export const profileInputSchema = z.object({
  fullName: optionalText(200),
  headline: optionalText(200),
  phone: optionalText(50),
  location: optionalText(200),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  summary: optionalText(2000),
  skills: optionalText(4000),
  experience: optionalText(12000),
  education: optionalText(4000),
  projects: optionalText(8000),
  certifications: optionalText(2000),
  targetRoles: optionalText(300),
  targetLocations: optionalText(300),
  workPreference: z.preprocess(
    emptyToUndefined,
    z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]).optional(),
  ),
  experienceLevel: z.preprocess(
    emptyToUndefined,
    z.enum(["INTERNSHIP", "ENTRY", "MID", "SENIOR", "LEAD"]).optional(),
  ),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
