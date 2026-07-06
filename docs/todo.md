# TrackMyApply AI — TODO

Status: **planning only** — a task backlog, not a build log. Nothing here is
checked off yet because nothing has been built. Organized by the milestones in
`docs/milestone-plan.md`; use that document for order/dependencies and
`docs/architecture.md` for the technical decisions each task assumes.

## M0 — Foundations

Locked decisions (see `docs/architecture.md` §3/§8): Auth.js (Credentials
provider) for auth, PostgreSQL + Prisma for data, OpenAI API for AI (not
called yet), Vercel for deployment.

- [x] Install and configure Prisma; connect to PostgreSQL; initial schema for
      Auth.js's required models (`User`, `Account`, `Session`,
      `VerificationToken`).
- [x] Install and configure Auth.js (NextAuth v5) with the Credentials
      provider (email + password, hashed with bcrypt); sign up/sign in/sign
      out flows.
- [x] Protected route group for authenticated pages (placeholder dashboard).
- [x] Root layout + nav shell; simple homepage.
- [x] `.env.example` documenting required environment variables.
- [ ] Run `prisma migrate dev` against a real PostgreSQL instance (requires a
      local/hosted database — not run in this environment; see repo root
      README/setup notes for the command).

## M1 — Job tracking

- [ ] `Job` schema/migration (company, title, JD text, source URL, status,
      appliedDate, notes, owner).
- [ ] Create job form ("add a job").
- [ ] Edit job (fields + status transitions).
- [ ] Delete job (with confirmation).
- [ ] Job list/board view grouped or filterable by status.
- [ ] Job detail page shell (to be extended by later milestones).

## M2 — Resume versions

- [ ] `ResumeVersion` schema/migration.
- [ ] Create / rename / duplicate / delete a resume version.
- [ ] Resume version list page.
- [ ] Resume version edit page (structured text editor per M0 content-shape
      decision).
- [ ] Associate a resume version with a job (selector on job detail).

## M3 — JD parsing + fit scoring

- [ ] `ParsedJobDescription` schema/migration.
- [ ] AI provider interface module (`lib/ai`), server-only.
- [ ] `parseJobDescription(text)` function + prompt.
- [ ] Wire JD paste/edit UI on job detail to trigger parsing and display
      structured fields.
- [ ] `FitScore` schema/migration.
- [ ] `scoreFit(resume, parsedJD)` function + prompt.
- [ ] UI to pick a resume version for a job and display score + rationale.
- [ ] "Recompute" action for both parsing and scoring.

## M4 — Resume tailoring

- [ ] `tailorResume(resume, parsedJD)` function + prompt.
- [ ] UI to request tailored suggestions on a job (using its parsed JD +
      a chosen base resume version).
- [ ] Review UI for suggestions (accept/edit before saving).
- [ ] "Save as new resume version" action reusing M2's resume version create.

## M5 — Interview prep

- [ ] `InterviewPrepSet` schema/migration.
- [ ] `generateInterviewPrep(parsedJD)` function + prompt.
- [ ] UI to generate and display a question/topic list on a job.
- [ ] Free-text notes field per job for practice notes.

## M6 — Reminders

- [ ] `Reminder` schema/migration.
- [ ] Add/edit/delete a reminder on a job (date + note).
- [ ] Mark reminder done.
- [ ] "Upcoming reminders" view (e.g. dashboard widget or dedicated page).

## M7 — Analytics

- [ ] Query: applications-over-time counts.
- [ ] Query: status funnel counts (saved/applied/interviewing/offer/rejected).
- [ ] Query: response/interview rate.
- [ ] Query: average fit score across jobs.
- [ ] Analytics page assembling the above into a simple dashboard.

## M8 — Polish and hardening

- [ ] Empty states for every list/detail view (no jobs yet, no resumes yet,
      no reminders yet, etc.).
- [ ] Error handling/user-facing messaging for AI calls (parsing/scoring/
      tailoring/prep failures).
- [ ] Responsive layout pass (mobile browser usability).
- [ ] Basic accessibility pass (labels, focus states, contrast).
- [ ] Seed/demo data script for local development.
- [ ] Re-read `docs/product-spec.md`, `docs/architecture.md`, and this plan
      against what was actually built; correct any drift.

## Explicitly not on this list (see product-spec.md §4)

Team/multi-user features, native mobile app, billing, ATS integrations,
scraping (email or job boards), browser extension, push notifications,
calendar sync, mock interview simulation. Do not add tasks for these without
first updating `docs/product-spec.md` to bring them into scope.
