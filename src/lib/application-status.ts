// Single source of truth for application status values, shared by the Zod
// validation schema and the status UI components. Must match the
// `ApplicationStatus` enum in prisma/schema.prisma exactly.
export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatusValue, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Tailwind classes per status, used by both the read-only badge and the
// inline status select so they look consistent.
// Milestone 6: statuses counted as "in progress" for dashboard summaries —
// everything before a final outcome. OFFER/REJECTED/WITHDRAWN are terminal
// (an offer is its own dashboard metric, not double-counted as "active").
export const ACTIVE_APPLICATION_STATUSES: readonly ApplicationStatusValue[] = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
];

export const STATUS_STYLES: Record<ApplicationStatusValue, string> = {
  SAVED:
    "bg-white/10 text-zinc-300",
  APPLIED:
    "bg-blue-400/15 text-blue-300",
  SCREENING:
    "bg-purple-400/15 text-purple-300",
  INTERVIEW:
    "bg-amber-400/15 text-amber-300",
  OFFER:
    "bg-green-400/15 text-green-300",
  REJECTED:
    "bg-red-400/15 text-red-300",
  WITHDRAWN:
    "bg-white/[.06] text-zinc-500",
};

// Milestone 6 Batch 5: solid bar-fill colors for the dashboard's status
// breakdown chart. Deliberately a separate palette from STATUS_STYLES above
// — badge colors are light-background/dark-text pairs tuned for small text
// pills, not validated as chart marks. These are hand-picked from the
// dataviz skill's pre-validated 8-hue categorical set and re-validated for
// this exact 7-status order with scripts/validate_palette.js (both light
// and dark pass: lightness band, chroma floor, CVD adjacent-pair
// separation). Hue choices keep continuity with STATUS_STYLES where it
// already read clearly (blue/green/red); SAVED/SCREENING/WITHDRAWN needed a
// real hue since gray has too little chroma to work as a chart mark.
export const STATUS_CHART_BAR_CLASSES: Record<ApplicationStatusValue, string> = {
  SAVED: "bg-[#d95926]",
  APPLIED: "bg-[#3987e5]",
  SCREENING: "bg-[#c98500]",
  INTERVIEW: "bg-[#9085e9]",
  OFFER: "bg-[#008300]",
  REJECTED: "bg-[#e66767]",
  WITHDRAWN: "bg-[#d55181]",
};
