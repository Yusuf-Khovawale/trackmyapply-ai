"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(app)/dashboard/resumes/actions";

const fieldClass =
  "glass-input px-3 py-2 text-sm";

export type ResumeFormDefaults = {
  title?: string;
  versionLabel?: string;
  baseRole?: string;
  fileUrl?: string;
  content?: string;
  notes?: string;
};

export function ResumeForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ResumeFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. General resume"
          defaultValue={defaultValues?.title}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Version label
          <input
            name="versionLabel"
            type="text"
            placeholder="e.g. Data-focused v2"
            defaultValue={defaultValues?.versionLabel}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Base role
          <input
            name="baseRole"
            type="text"
            placeholder="e.g. Software Engineer"
            defaultValue={defaultValues?.baseRole}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        File URL
        <input
          name="fileUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaultValues?.fileUrl}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Content
        <textarea
          name="content"
          rows={10}
          placeholder="Paste resume text or markdown…"
          defaultValue={defaultValues?.content}
          className={fieldClass}
        />
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
        <p className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
