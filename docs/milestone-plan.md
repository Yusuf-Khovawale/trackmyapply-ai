# TrackMyApply AI — Milestone Plan

Status: **planning only** — no implementation has started. This orders the
MVP feature set from `docs/product-spec.md` into buildable, demoable
milestones. Each milestone should be shippable/demoable on its own before
moving to the next; later milestones deliberately depend on earlier ones.

## M0 — Foundations (no user-facing features)

Stack decisions are locked (see `docs/architecture.md` §3/§8): Auth.js
(Credentials provider), PostgreSQL + Prisma, OpenAI API (not called until
`M3`), Vercel.

- Set up auth (sign up / sign in / sign out) and a protected route group.
- Set up Prisma + PostgreSQL and run an initial migration covering Auth.js's
  required models.
- Basic app shell: root layout, nav, simple homepage, placeholder dashboard.
- `.env.example` documenting required environment variables.
- **Exit criteria:** a user can create an account, log in, and see an empty
  (placeholder) dashboard. No job/resume/AI features yet.

## M1 — Job tracking (core)

- Add / edit / delete a job application (company, title, JD text, source
  link, applied date, notes, status).
- Status field with the fixed MVP pipeline (saved → applied → interviewing →
  offer/rejected/withdrawn).
- Job list/board view on the dashboard.
- **Depends on:** M0 (auth + DB).
- **Exit criteria:** a user can log a job application, edit its status, and
  see all their applications in a list.

## M2 — Multiple resume versions

- Create / rename / duplicate / delete resume versions (structured text).
- Attach a specific resume version to a job application.
- **Depends on:** M0. Independent of M1 in data terms, but the "attach to a
  job" step needs M1's Job entity to exist.
- **Exit criteria:** a user can maintain 2+ resume versions and associate one
  with a given job.

## M3 — JD parsing + fit scoring

- Paste/edit JD text on a job; call the AI provider to extract structured
  fields (skills, responsibilities, seniority, keywords); store and display
  the result.
- Compute a fit score + short rationale from parsed JD + a chosen resume
  version; allow recompute on demand.
- **Depends on:** M1 (Job), M2 (ResumeVersion), and the AI provider decision
  from M0.
- **Exit criteria:** pasting a JD on a job produces visible parsed fields, and
  selecting a resume version produces a fit score with rationale.

## M4 — Resume tailoring

- Generate suggested edits (tailored bullets/keyword call-outs) from a
  parsed JD + a base resume version.
- User reviews suggestions and saves them as a new resume version (reusing
  M2's resume version CRUD).
- **Depends on:** M2, M3 (needs parsed JD as input).
- **Exit criteria:** a user can generate tailored suggestions for a job and
  save the result as a new resume version.

## M5 — Interview prep

- Generate a list of likely interview questions/topics per job from the
  parsed JD (+ company/title).
- Free-text notes area per job for practice notes.
- **Depends on:** M3 (needs parsed JD as input).
- **Exit criteria:** a user can view a generated prep list on a job and jot
  down notes.

## M6 — Reminders

- Manually add a reminder (date + note) on a job; mark done.
- "Upcoming reminders" list (e.g. on the dashboard).
- **Depends on:** M1 (Job).
- **Exit criteria:** a user can set a reminder on a job and see it surfaced in
  an upcoming-reminders view until marked done.

## M7 — Analytics

- Dashboard: applications over time, status funnel counts, response/interview
  rate, average fit score.
- Purely derived from M1 (status history) and M3 (fit scores) data — no new
  entities.
- **Depends on:** M1, M3.
- **Exit criteria:** the analytics page renders real numbers/charts from the
  user's own tracked job data.

## M8 — Polish and hardening

- Empty states and error handling across all features.
- Basic responsive layout and accessibility pass.
- Seed/demo data for local development and manual QA.
- Review documentation (this plan, product spec, architecture) against what
  was actually built and correct drift.
- **Exit criteria:** the MVP feature set from `docs/product-spec.md` §3 works
  end to end for a new user with no dead ends or unhandled errors on the
  golden path.

## Why this order

- Job tracking (M1) comes first because every other feature attaches to a
  Job.
- Resume versions (M2) come next because fit scoring/tailoring both need a
  resume to compare against, and this feature has no AI dependency so it can
  be built and demoed independently.
- JD parsing + fit scoring (M3) is the first AI-dependent milestone and the
  common input for both tailoring (M4) and interview prep (M5) — building it
  once and reusing its output avoids duplicating "call the AI provider with a
  JD" logic across three features.
- Reminders (M6) is intentionally simple and Job-only, so it can slot in
  whenever convenient relative to M3–M5; it's ordered after them here only
  because it's lower priority for a first working demo, not because of a
  hard dependency.
- Analytics (M7) is last among features because it aggregates data produced
  by M1 and M3 — it needs real usage history to be meaningful to build
  against.
