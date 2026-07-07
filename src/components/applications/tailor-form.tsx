"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  TailorState,
  SaveTailorState,
  CoverLetterState,
} from "@/app/(app)/dashboard/applications/[id]/tailor/actions";
import { ContentPreview } from "@/components/applications/content-preview";
import { structuredToLatex } from "@/lib/resume-render";

const fieldClass = "glass-input px-3 py-2 text-sm";

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

// Honest framing: the score is ATS keyword coverage, and the band is an
// interview-screen estimate derived from it — not a hiring guarantee.
function hireBand(score: number): { label: string; className: string } {
  if (score >= 90)
    return { label: "Excellent — very strong screen-pass odds", className: "text-green-300" };
  if (score >= 75)
    return { label: "Strong — good screen-pass odds", className: "text-cyan-300" };
  if (score >= 60)
    return { label: "Moderate — consider closing more gaps", className: "text-amber-300" };
  return { label: "Low — this JD may be a stretch fit", className: "text-red-400" };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 90 ? "#4ade80" : clamped >= 75 ? "#67e8f9" : clamped >= 60 ? "#fcd34d" : "#f87171";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${label}: ${clamped} out of 100`}>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="49" textAnchor="middle" fill="#e8eaf2" fontSize="20" fontWeight="600">
          {clamped}
        </text>
      </svg>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

export function TailorForm({
  action,
  saveAction,
  coverLetterAction,
  resumes,
  initialCoverLetter,
}: {
  action: (prevState: TailorState, formData: FormData) => Promise<TailorState>;
  saveAction: (
    prevState: SaveTailorState,
    formData: FormData,
  ) => Promise<SaveTailorState>;
  coverLetterAction: (
    prevState: CoverLetterState,
    formData: FormData,
  ) => Promise<CoverLetterState>;
  resumes: ResumeOption[];
  initialCoverLetter: string | null;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [saveState, saveFormAction, isSavePending] = useActionState(
    saveAction,
    undefined,
  );
  const [letterState, letterFormAction, isLetterPending] = useActionState(
    coverLetterAction,
    undefined,
  );
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [draftText, setDraftText] = useState("");

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId),
    [resumes, selectedResumeId],
  );
  const result = state && "draft" in state ? state : null;
  const currentDraft = draftText || result?.draft || "";
  const coverLetter =
    letterState && "letter" in letterState
      ? letterState.letter
      : initialCoverLetter;

  const downloadTex = () => {
    if (!result) return;
    const blob = new Blob([structuredToLatex(result.structured)], {
      type: "application/x-tex",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume.tex";
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
          <p className="text-sm text-red-400">{state.error}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
          >
            {isPending
              ? "Optimizing for 90%+ match…"
              : result
                ? "Regenerate optimized resume"
                : "Generate optimized resume"}
          </button>
          {isPending ? (
            <span className="text-xs text-zinc-400">
              The AI drafts, scores against the JD, and revises until it
              clears 90% — this can take up to a minute.
            </span>
          ) : null}
        </div>
      </form>

      {result ? (
        <>
          {/* Score panel */}
          <div className="glass-card flex flex-wrap items-center gap-8 p-6">
            <ScoreRing score={result.baseScore} label="Base resume" />
            <span aria-hidden className="text-2xl text-zinc-500">→</span>
            <ScoreRing score={result.matchScore} label="Optimized resume" />
            <div className="min-w-[220px] flex-1">
              <p className={`text-sm font-semibold ${hireBand(result.matchScore).className}`}>
                {hireBand(result.matchScore).label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Scores measure ATS keyword coverage against this job
                description ({result.attempts}{" "}
                {result.attempts === 1 ? "pass" : "passes"}). Improvement:{" "}
                <span className="font-medium text-zinc-50">
                  {result.matchScore - result.baseScore >= 0 ? "+" : ""}
                  {result.matchScore - result.baseScore} points
                </span>
                . Only your real experience was used — no invented skills.
              </p>
              {result.missing.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium text-zinc-400">
                    Gaps the AI couldn&apos;t truthfully close:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {result.missing.map((term) => (
                      <span
                        key={term}
                        className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs text-amber-300"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Genuinely have one of these? Add it to your Profile and
                    regenerate.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ContentPreview
              title={`Base resume — ${
                selectedResume ? resumeOptionLabel(selectedResume) : "unknown"
              }`}
              content={selectedResume?.content}
              emptyText="This resume has no content saved."
              maxHeightClassName="max-h-[28rem]"
            />

            <form action={saveFormAction} className="flex flex-col gap-2 glass-card p-4">
              <h2 className="text-sm font-medium text-zinc-400">
                Optimized draft (editable)
              </h2>
              <textarea
                name="draft"
                rows={16}
                value={currentDraft}
                onChange={(event) => setDraftText(event.target.value)}
                className={`${fieldClass} max-h-[28rem]`}
              />
              <input type="hidden" name="baseResumeId" value={selectedResumeId} />
              <input
                type="hidden"
                name="structuredJson"
                value={JSON.stringify(result.structured)}
              />
              <input type="hidden" name="matchScore" value={result.matchScore} />
              <input type="hidden" name="baseScore" value={result.baseScore} />

              <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="linkToApplication" value="true" defaultChecked />
                  Link this resume to this application
                </label>

                {saveState?.error ? (
                  <p className="text-sm text-red-400">{saveState.error}</p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSavePending}
                    className="rounded-full btn-primary px-5 py-2 text-sm disabled:opacity-60"
                  >
                    {isSavePending ? "Saving…" : "Save & open print view"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadTex}
                    className="btn-secondary rounded-full px-5 py-2 text-sm"
                  >
                    Download .tex
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Saving creates a new resume version and opens the
                  print-ready view for a one-click PDF. The .tex file
                  compiles as-is in Overleaf.
                </p>
              </div>
            </form>
          </div>
        </>
      ) : null}

      {/* Cover letter */}
      <div className="glass-card flex flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-50">Cover letter</h2>
          <form action={letterFormAction}>
            <input
              type="hidden"
              name="resumeText"
              value={currentDraft || selectedResume?.content || ""}
            />
            <button
              type="submit"
              disabled={isLetterPending || (!currentDraft && !selectedResume?.content)}
              className="btn-secondary rounded-full px-4 py-1.5 text-sm"
            >
              {isLetterPending
                ? "Writing…"
                : coverLetter
                  ? "Regenerate cover letter"
                  : "Generate cover letter"}
            </button>
          </form>
        </div>
        {letterState && "error" in letterState ? (
          <p className="text-sm text-red-400">{letterState.error}</p>
        ) : null}
        {coverLetter ? (
          <>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white/[.04] p-4 font-sans text-sm leading-relaxed text-zinc-300">
              {coverLetter}
            </pre>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(coverLetter)}
              className="btn-secondary self-start rounded-full px-4 py-1.5 text-xs"
            >
              Copy to clipboard
            </button>
          </>
        ) : (
          <p className="text-sm text-zinc-500">
            Generates a specific, professional letter from your optimized
            resume and this job description. Saved with the application.
          </p>
        )}
      </div>
    </div>
  );
}
