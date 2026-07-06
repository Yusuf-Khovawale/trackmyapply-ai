# TrackMyApply AI — Architecture

Status: **planning only** — describes intended structure; nothing here has
been implemented yet. See `docs/product-spec.md` for feature scope and
`docs/milestone-plan.md` for build order.

## 1. Current repo state (as of this writing)

- Fresh `create-next-app` scaffold: Next.js `16.2.10`, React `19.2.4`,
  TypeScript, Tailwind CSS v4, ESLint flat config.
- App Router only (`src/app`), no Pages Router.
- No database, ORM, auth library, or AI SDK installed yet.
- No API routes, server actions, or data layer exist yet — only the default
  landing page (`src/app/page.tsx`) and root layout.

## 2. Framework version notes (Next.js 16 — read before coding)

This project pins a Next.js version newer than most training data, per
`AGENTS.md`. The conventions below differ from "classic" Next.js knowledge and
must be followed:

- **`proxy.ts` replaces `middleware.ts`.** The file/function is named `proxy`,
  not `middleware`. It runs on the Node.js runtime only (no Edge runtime
  option). If any cross-cutting request logic (e.g. auth gate) is needed, it
  goes in `proxy.ts`.
- **Async request APIs are mandatory, not optional.** `cookies()`, `headers()`,
  `draftMode()`, `params`, and `searchParams` are all `Promise`-based with no
  synchronous fallback. Every page/layout/route handler that reads these must
  `await` them.
- **Turbopack is the default** for both `next dev` and `next build`. No
  `--turbopack` flag needed; a custom webpack config would need explicit
  opt-in via `--webpack`.
- **Mutations go through Server Actions** (`'use server'` functions), not
  ad-hoc client-side `fetch` to hand-rolled API routes, except where a true
  external-facing HTTP endpoint is needed (e.g. a webhook).
- **Caching APIs:** `revalidateTag` now requires a `cacheLife` profile argument;
  `updateTag` exists for read-your-writes semantics after a Server Action;
  `cacheLife`/`cacheTag` no longer need the `unstable_` prefix. Whether to
  enable `cacheComponents` in `next.config.ts` is a decision to make once real
  data fetching exists — not needed for the current empty scaffold.
- Use `npx next typegen` to generate typed `PageProps`/`LayoutProps` helpers
  once dynamic routes exist, instead of hand-writing `params` types.

## 3. Stack (locked for MVP)

| Concern | Choice | Status |
|---|---|---|
| Framework | Next.js 16 App Router (already scaffolded) | locked |
| Language | TypeScript | locked |
| Styling | Tailwind CSS v4 (already scaffolded) | locked |
| Auth | Auth.js (NextAuth v5) — Credentials (email/password) provider for MVP | **locked** |
| Database | PostgreSQL | **locked** |
| ORM/data access | Prisma | **locked** |
| AI provider | OpenAI API, behind the internal AI provider interface (§6) | **locked** |
| File/blob storage | Deferred — not needed until resume export exists | deferred |
| Email (reminders digest) | Deferred — reminders are in-app only for MVP | deferred |
| Deployment | Vercel | **locked** |

These decisions are final for the MVP. A sub-decision made while implementing
`M0`: the Auth.js **Credentials provider** (email + password, hashed with
bcrypt) is used rather than OAuth, since it requires no external app
registration and keeps sign-up self-contained. The Prisma schema still follows
the standard Auth.js adapter shape (`Account`/`Session`/`VerificationToken`
tables) so an OAuth provider can be added later without a schema rework.

## 4. High-level structure (target, once built)

```
src/
  app/
    (auth)/                # sign-in/sign-up routes
    dashboard/              # job list/board (home after login)
    jobs/
      new/                  # add a job (paste JD)
      [id]/                 # job detail: JD, parsed fields, fit score,
                             # tailored resume, interview prep, reminders
    resumes/
      [id]/                 # edit a resume version
    analytics/              # stats dashboard
    settings/
  lib/                      # data access, AI provider interface, auth config
  components/                # shared UI
proxy.ts                    # only if a cross-cutting request concern emerges
```

This structure is a sketch to guide later milestones, not a directive to
scaffold now.

## 5. Data model sketch (draft — not a final schema)

- **User** — account identity.
- **ResumeVersion** — belongs to a User; `title`, structured content, timestamps.
- **Job** (application) — belongs to a User; `company`, `title`, JD text,
  optional source URL, `status` enum (saved / applied / interviewing / offer /
  rejected / withdrawn), `appliedDate`, `notes`, optional link to a
  `ResumeVersion` used.
- **ParsedJobDescription** — 1:1 with a Job; structured fields extracted from
  JD text (skills, responsibilities, seniority, keywords).
- **FitScore** — belongs to a (Job, ResumeVersion) pair; numeric score +
  rationale text.
- **InterviewPrepSet** — belongs to a Job; generated questions/topics +
  free-text notes.
- **Reminder** — belongs to a Job; `dueDate`, `note`, `done` flag.
- Analytics are **computed**, not stored — derived from `Job` records and
  status history at read time.

This is intentionally a sketch to validate the feature set is coherent; exact
column types, indices, and migrations are implementation details for `M0`/`M1`.

## 6. AI integration approach

All four AI-touching features (JD parsing, fit scoring, resume tailoring,
interview prep generation) should sit behind a single internal interface
(e.g. `lib/ai/*`) rather than calling a provider SDK directly from route/page
code. This means:

- The product features do not depend on which AI provider/model is chosen.
- Each feature is a distinct function (e.g. `parseJobDescription(text)`,
  `scoreFit(resume, parsedJD)`, `tailorResume(resume, parsedJD)`,
  `generateInterviewPrep(parsedJD)`) with its own prompt, independently
  testable.
- All AI calls happen server-side (Server Actions or server-only modules),
  never from the client, to keep API keys server-only.

The specific provider/model is not decided in this document — that's a
pre-`M3` decision (see milestone plan), since JD parsing is the first AI
feature on the critical path.

## 7. Non-functional assumptions

- Single-region deployment on Vercel; no multi-region/HA requirement
  (student-scale traffic).
- No special compliance/regulatory requirements assumed (resume content + email
  are the only personal data handled); standard care around auth secrets and
  not logging resume/JD content is still expected.
- No offline/PWA requirement for MVP.

## 8. Decisions locked for the MVP

1. Auth: Auth.js (NextAuth v5), Credentials (email/password) provider.
2. Database: PostgreSQL. ORM: Prisma.
3. AI provider: OpenAI API, for all four AI-touching features.
4. Deployment target: Vercel.
5. Reminders: in-app only (no email/push) for MVP.
6. JD input: pasted text only (no scraping/upload) for MVP.
7. Resume data: structured text stored in the app (no PDF/DOCX upload/parse)
   for MVP.

One item remains open and should be resolved during `M2` (resume versions),
not `M0`: whether resume "structured content" is rich sections (experience,
education, skills as distinct fields) or a single text/markdown blob. `M0`
does not touch the `ResumeVersion` schema, so this doesn't block foundations
work.
