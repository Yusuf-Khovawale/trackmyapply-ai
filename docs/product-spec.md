# TrackMyApply AI — Product Spec

Status: **planning only** — nothing in this document has been built yet.

## 1. Problem

Students and recent grads applying to internships/entry-level jobs typically track
applications across scattered spreadsheets, email threads, and notes apps, and
maintain multiple resume copies with no clear link between "which resume did I
send to which job." This makes it hard to stay organized, to tailor applications
efficiently, and to prepare for interviews on short notice.

## 2. Target user

- Primary: a university student or recent graduate applying to internships or
  entry-level roles.
- Single-user product for the MVP — no recruiter, team, or multi-user/collaboration
  features.
- Assumed usage pattern: desktop/laptop browser, moderate volume (tens, not
  thousands, of tracked applications).

## 3. MVP feature list

Each feature below is scoped deliberately narrow. "Out of scope" items are not
omissions — they are explicitly deferred to keep the MVP shippable.

### 3.1 Job tracking

- **Goal:** one place to record every application and its current status.
- **User story:** "As a student, I want to log a job I applied to and update its
  status over time, so I stop losing track of applications."
- **In scope:** manually add a job (company, title, JD text, source link,
  applied date, notes); a status field (e.g. saved → applied → interviewing →
  offer/rejected/withdrawn); list/board view; edit and delete.
- **Out of scope (MVP):** auto-import from email or job boards, browser
  extension, team/shared boards, custom user-defined statuses/pipelines.

### 3.2 Multiple resume versions

- **Goal:** maintain several resume variants and know which one is "the one."
- **User story:** "As a student, I want to keep a few resume versions (e.g.
  general, data-focused, PM-focused) and pick which one I used for each job."
- **In scope:** create/rename/duplicate/delete resume versions stored as
  structured text; associate one resume version with a job application.
- **Out of scope (MVP):** binary file upload/parsing of existing PDF/DOCX
  resumes, WYSIWYG resume design/formatting, resume export to a styled PDF.

### 3.3 Job description parsing

- **Goal:** turn a pasted job description into structured, usable fields.
- **User story:** "As a student, I want to paste a JD and have it broken down
  into key skills/requirements automatically, instead of re-reading it every
  time."
- **In scope:** paste raw JD text on a job; extract structured fields (required
  skills, responsibilities, seniority level, keywords) via an AI call; store
  and display the parsed result.
- **Out of scope (MVP):** scraping job boards by URL, parsing JDs from images/PDF
  attachments, multi-language parsing.

### 3.4 Fit scoring

- **Goal:** a quick signal of how well a chosen resume matches a given job.
- **User story:** "As a student, I want to see a score and short rationale for
  how well my resume matches a job, so I know if I should tailor it before
  applying."
- **In scope:** compute a score (e.g. 0–100) and a short textual rationale from
  the parsed JD + a selected resume version; recompute on demand.
- **Out of scope (MVP):** a trained/custom ML scoring model, score history
  trending over time, comparing more than one resume at once.

### 3.5 Resume tailoring

- **Goal:** help the student adjust a resume for a specific job.
- **User story:** "As a student, I want suggested edits/bullets tailored to a
  job's JD, so I can quickly create a tailored resume version."
- **In scope:** generate suggested edits (bullet rewrites, keyword call-outs)
  from the parsed JD + a chosen base resume version; user reviews and saves
  the result as a new resume version.
- **Out of scope (MVP):** fully automated one-click resume rewriting with no
  review step, layout/design changes, cover-letter generation.

### 3.6 Interview prep

- **Goal:** give the student a head start preparing for an interview.
- **User story:** "As a student, I want a list of likely interview questions
  for a specific job, so I can prepare instead of starting from a blank page."
- **In scope:** generate a list of likely questions/topics per job from the
  parsed JD (and company/title text); simple free-text notes area per job to
  jot down answers/practice notes.
- **Out of scope (MVP):** mock interview simulation, voice/video AI interview
  practice, scheduling of interview practice sessions.

### 3.7 Reminders

- **Goal:** don't let follow-ups or deadlines slip.
- **User story:** "As a student, I want to see what needs my attention soon
  (follow up, interview date, deadline), so nothing falls through the cracks."
- **In scope:** manually set a reminder (date + note) on a job; an
  "upcoming reminders" list; mark a reminder done.
- **Out of scope (MVP):** push notifications, email digests, calendar
  integration (Google Calendar sync), recurring/smart auto-generated reminders.

### 3.8 Analytics

- **Goal:** basic visibility into the student's job search as a whole.
- **User story:** "As a student, I want to see how many applications I've sent,
  my response rate, and where I'm dropping off, so I can adjust my strategy."
- **In scope:** simple dashboard: applications over time, status funnel counts,
  response/interview rate, average fit score.
- **Out of scope (MVP):** benchmarking against other users/cohorts, exportable
  reports, predictive analytics ("likelihood of offer").

## 4. Explicit non-goals for the MVP

- No multi-user/team/recruiter features.
- No native mobile app (responsive web only).
- No billing/subscriptions/payments.
- No ATS integrations.
- No automated scraping of job boards or email inboxes.
- No browser extension.

## 5. Key assumptions

These are assumptions made to keep scope realistic; they should be revisited
before implementation if they don't match reality:

1. Job descriptions are added by **pasting text**, not by URL scraping or file
   upload — avoids scraping/ToS and parsing-format complexity.
2. Resumes are authored/stored as **structured text within the app**, not
   uploaded as existing PDF/DOCX files — avoids building document parsing.
3. The product is **single-user per account**; no sharing or collaboration.
4. AI features (parsing, fit scoring, tailoring, interview prep) depend on an
   external AI API. The specific provider is an implementation detail to be
   decided in `architecture.md` and is abstracted behind one interface so it
   can change without affecting product scope.
5. "Reminders" means in-app visibility (an upcoming list), not push
   notifications or external calendar sync, unless revisited later.
6. Analytics are computed from the student's own tracked data only — no
   external benchmarking data source is assumed to exist.

See `docs/architecture.md` for how these assumptions map to technical
decisions, and `docs/milestone-plan.md` for delivery order.
