import { z } from "zod";

// Structured resume shape produced by the tailoring pipeline and consumed
// by the plain-text renderer, the print/PDF view, and the .tex export.
// Everything is optional-with-defaults so a slightly imperfect model
// response still parses instead of failing the whole generation.
const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);

export const structuredResumeSchema = z.object({
  contact: z
    .object({
      name: str.default(""),
      email: str.default(""),
      phone: str.default(""),
      location: str.default(""),
      linkedin: str.default(""),
      github: str.default(""),
      portfolio: str.default(""),
    })
    .catch({
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    }),
  headline: str.default(""),
  summary: str.default(""),
  skills: z
    .array(z.object({ category: str.default(""), items: strArr.default([]) }))
    .catch([]),
  experience: z
    .array(
      z.object({
        title: str.default(""),
        company: str.default(""),
        location: str.default(""),
        dates: str.default(""),
        bullets: strArr.default([]),
      }),
    )
    .catch([]),
  projects: z
    .array(
      z.object({
        name: str.default(""),
        tech: str.default(""),
        bullets: strArr.default([]),
      }),
    )
    .catch([]),
  education: z
    .array(
      z.object({
        degree: str.default(""),
        school: str.default(""),
        dates: str.default(""),
        details: str.default(""),
      }),
    )
    .catch([]),
  certifications: strArr.default([]),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;
