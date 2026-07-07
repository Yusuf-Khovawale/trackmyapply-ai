"use client";

import { useActionState } from "react";
import type { ProfileActionState } from "@/app/(app)/dashboard/profile/actions";

const fieldClass = "glass-input px-3 py-2 text-sm";
const labelClass = "flex flex-col gap-1 text-sm text-zinc-300";

export type ProfileDefaults = {
  fullName?: string | null;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  summary?: string | null;
  skills?: string | null;
  experience?: string | null;
  education?: string | null;
  projects?: string | null;
  certifications?: string | null;
  targetRoles?: string | null;
  targetLocations?: string | null;
  workPreference?: string | null;
  experienceLevel?: string | null;
};

export function ProfileForm({
  action,
  defaults,
}: {
  action: (
    prevState: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  defaults: ProfileDefaults | null;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const d = defaults ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="glass-card flex flex-col gap-4 p-6">
        <h2 className="text-sm font-semibold text-zinc-50">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Full name
            <input name="fullName" defaultValue={d.fullName ?? ""} className={fieldClass} placeholder="Mohammed Yusuf" />
          </label>
          <label className={labelClass}>
            Headline
            <input name="headline" defaultValue={d.headline ?? ""} className={fieldClass} placeholder="Full-Stack Developer" />
          </label>
          <label className={labelClass}>
            Phone
            <input name="phone" defaultValue={d.phone ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            Location
            <input name="location" defaultValue={d.location ?? ""} className={fieldClass} placeholder="City, Country" />
          </label>
          <label className={labelClass}>
            LinkedIn URL
            <input name="linkedinUrl" defaultValue={d.linkedinUrl ?? ""} className={fieldClass} placeholder="https://linkedin.com/in/…" />
          </label>
          <label className={labelClass}>
            GitHub URL
            <input name="githubUrl" defaultValue={d.githubUrl ?? ""} className={fieldClass} placeholder="https://github.com/…" />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Portfolio URL
            <input name="portfolioUrl" defaultValue={d.portfolioUrl ?? ""} className={fieldClass} placeholder="https://…" />
          </label>
        </div>
      </section>

      <section className="glass-card flex flex-col gap-4 p-6">
        <h2 className="text-sm font-semibold text-zinc-50">
          Experience &amp; skills
        </h2>
        <p className="-mt-2 text-xs text-zinc-500">
          This is the raw material the AI uses to build and tailor your
          resumes — the more complete and specific it is, the higher your
          JD match scores can go. Only what you write here is ever used;
          nothing is invented.
        </p>
        <label className={labelClass}>
          Professional summary
          <textarea name="summary" rows={3} defaultValue={d.summary ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Skills (comma-separated; include tools, frameworks, languages)
          <textarea name="skills" rows={3} defaultValue={d.skills ?? ""} className={fieldClass} placeholder="React, TypeScript, Node.js, PostgreSQL, Docker, AWS…" />
        </label>
        <label className={labelClass}>
          Work experience (role, company, dates, achievements — one block per job)
          <textarea name="experience" rows={8} defaultValue={d.experience ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Projects
          <textarea name="projects" rows={4} defaultValue={d.projects ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Education
          <textarea name="education" rows={3} defaultValue={d.education ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Certifications
          <textarea name="certifications" rows={2} defaultValue={d.certifications ?? ""} className={fieldClass} />
        </label>
      </section>

      <section className="glass-card flex flex-col gap-4 p-6">
        <h2 className="text-sm font-semibold text-zinc-50">
          Job preferences
        </h2>
        <p className="-mt-2 text-xs text-zinc-500">
          Used by the Job Finder to pre-fill searches on LinkedIn, Indeed,
          and Google.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Target roles
            <input name="targetRoles" defaultValue={d.targetRoles ?? ""} className={fieldClass} placeholder="Frontend Developer, Full-Stack Engineer" />
          </label>
          <label className={labelClass}>
            Target locations
            <input name="targetLocations" defaultValue={d.targetLocations ?? ""} className={fieldClass} placeholder="Hyderabad, Remote" />
          </label>
          <label className={labelClass}>
            Work preference
            <select name="workPreference" defaultValue={d.workPreference ?? ""} className={fieldClass}>
              <option value="">No preference</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
              <option value="ANY">Any</option>
            </select>
          </label>
          <label className={labelClass}>
            Experience level
            <select name="experienceLevel" defaultValue={d.experienceLevel ?? ""} className={fieldClass}>
              <option value="">Select…</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="ENTRY">Entry level</option>
              <option value="MID">Mid level</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead / Manager</option>
            </select>
          </label>
        </div>
      </section>

      {state?.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary self-start rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
