import { z } from "zod";
import { APPLICATION_STATUSES } from "@/lib/application-status";

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

const emptyToUndefined = (value: unknown) =>
  value === null || (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(500).url("Enter a valid URL").optional(),
);

const optionalDateInput = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
);

export const applicationInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  role: z.string().trim().min(1, "Role is required").max(200),
  jobUrl: optionalUrl,
  source: optionalText(100),
  status: applicationStatusSchema,
  dateApplied: optionalDateInput,
  resumeVersion: optionalText(100),
  resumeId: optionalText(100),
  followUpDate: optionalDateInput,
  notes: optionalText(2000),
  jobDescription: optionalText(20000),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
