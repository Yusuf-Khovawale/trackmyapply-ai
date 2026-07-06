"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationStatusValue,
} from "@/lib/application-status";
import type { ActionState } from "@/app/(app)/dashboard/actions";

const fieldClass =
  "rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/[.145] dark:focus:border-white/40";

export type ResumeOption = {
  id: string;
  title: string;
  versionLabel: string | null;
};

export type ApplicationFormDefaults = {
  company?: string;
  role?: string;
  jobUrl?: string;
  source?: string;
  status?: ApplicationStatusValue;
  dateApplied?: string;
  resumeVersion?: string;
  resumeId?: string;
  followUpDate?: string;
  notes?: string;
  jobDescription?: string;
};

function resumeOptionLabel(resume: ResumeOption) {
  return resume.versionLabel
    ? `${resume.title} — ${resume.versionLabel}`
    : resume.title;
}

export function ApplicationForm({
  action,
  defaultValues,
  submitLabel,
  resumes,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ApplicationFormDefaults;
  submitLabel: string;
  resumes: ResumeOption[];
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Company
          <input
            name="company"
            type="text"
            required
            defaultValue={defaultValues?.company}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <input
            name="role"
            type="text"
            required
            defaultValue={defaultValues?.role}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "SAVED"}
            className={fieldClass}
          >
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Source
          <input
            name="source"
            type="text"
            placeholder="LinkedIn, Indeed, Company Site…"
            defaultValue={defaultValues?.source}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Job URL
        <input
          name="jobUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaultValues?.jobUrl}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Job description
        <textarea
          name="jobDescription"
          rows={8}
          placeholder="Paste the job posting text here…"
          defaultValue={defaultValues?.jobDescription}
          className={fieldClass}
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Kept as source material for future resume tailoring.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Date applied
          <input
            name="dateApplied"
            type="date"
            defaultValue={defaultValues?.dateApplied}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Follow-up date
          <input
            name="followUpDate"
            type="date"
            defaultValue={defaultValues?.followUpDate}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Resume
        <select
          name="resumeId"
          defaultValue={defaultValues?.resumeId ?? ""}
          className={fieldClass}
        >
          <option value="">No resume linked</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resumeOptionLabel(resume)}
            </option>
          ))}
        </select>
        {!defaultValues?.resumeId && defaultValues?.resumeVersion ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Previously recorded as &ldquo;{defaultValues.resumeVersion}
            &rdquo;. Link a saved resume above to replace this.
          </span>
        ) : null}
        {resumes.length === 0 ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            No saved resumes yet.{" "}
            <Link href="/dashboard/resumes/new" className="underline">
              Add one
            </Link>{" "}
            to link it here.
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes}
          className={fieldClass}
        />
      </label>

      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
