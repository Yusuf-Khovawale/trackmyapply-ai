"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  TailorState,
  SaveTailorState,
} from "@/app/(app)/dashboard/applications/[id]/tailor/actions";
import { ContentPreview } from "@/components/applications/content-preview";

const fieldClass =
  "rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/[.145] dark:focus:border-white/40";

export type ResumeOption = {
  id: string;
  title: string;
  versionLabel: string | null;
  content: string | null;
};

function resumeOptionLabel(resume: ResumeOption) {
  return resume.versionLabel
    ? `${resume.title} — ${resume.versionLabel}`
    : resume.title;
}

export function TailorForm({
  action,
  saveAction,
  resumes,
}: {
  action: (prevState: TailorState, formData: FormData) => Promise<TailorState>;
  saveAction: (
    prevState: SaveTailorState,
    formData: FormData,
  ) => Promise<SaveTailorState>;
  resumes: ResumeOption[];
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [saveState, saveFormAction, isSavePending] = useActionState(
    saveAction,
    undefined,
  );
  const [selectedResumeId, setSelectedResumeId] = useState("");

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId),
    [resumes, selectedResumeId],
  );
  const hasDraft = Boolean(state && "draft" in state);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Base resume
          <select
            name="resumeId"
            required
            value={selectedResumeId}
            onChange={(event) => setSelectedResumeId(event.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Select a resume…
            </option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resumeOptionLabel(resume)}
              </option>
            ))}
          </select>
        </label>

        {state && "error" in state ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {isPending
              ? "Generating…"
              : hasDraft
                ? "Regenerate tailored draft"
                : "Generate tailored draft"}
          </button>
          {isPending ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              This can take a few seconds…
            </span>
          ) : hasDraft ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Regenerating replaces the draft below — it won&apos;t affect
              anything you&apos;ve already saved.
            </span>
          ) : null}
        </div>
      </form>

      {hasDraft ? (
        <div className="flex flex-col gap-4 border-t border-black/[.08] pt-6 dark:border-white/[.145]">
          <div className="grid gap-4 md:grid-cols-2">
            <ContentPreview
              title={`Base resume — ${
                selectedResume ? resumeOptionLabel(selectedResume) : "unknown"
              }`}
              content={selectedResume?.content}
              emptyText="This resume has no content saved."
              maxHeightClassName="max-h-[28rem]"
            />

            <form
              action={saveFormAction}
              className="flex flex-col gap-2 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Tailored draft
              </h2>
              <textarea
                name="draft"
                rows={16}
                defaultValue={state && "draft" in state ? state.draft : ""}
                className={`${fieldClass} max-h-[28rem]`}
              />
              <input
                type="hidden"
                name="baseResumeId"
                value={selectedResumeId}
              />

              <div className="mt-2 flex flex-col gap-3 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
                <p className="text-sm font-medium text-black dark:text-zinc-50">
                  Save as new tailored resume
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Saving creates a new resume version in your library — it
                  never overwrites the base resume above. You can edit the
                  draft text before saving.
                </p>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="linkToApplication"
                    value="true"
                    defaultChecked
                  />
                  Link this resume to this application
                </label>

                {saveState?.error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {saveState.error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavePending}
                  className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
                >
                  {isSavePending ? "Saving…" : "Save as new tailored resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
