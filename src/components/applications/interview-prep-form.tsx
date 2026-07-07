"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  InterviewPrepActionState,
  GenerateInterviewPrepState,
} from "@/app/(app)/dashboard/applications/[id]/interview-prep/actions";
import type {
  LikelyQuestion,
  StarStory,
} from "@/lib/validation/interview-prep";
import {
  InterviewPrepChecklist,
  type ChecklistItem,
} from "@/components/applications/interview-prep-checklist";

const fieldClass =
  "glass-input px-3 py-2 text-sm";

const cardClass =
  "flex flex-col gap-3 glass-card p-4";

const STAR_FIELDS = ["situation", "task", "action", "result"] as const;

// Threshold used only for the readiness checklist below — not enforced
// anywhere else (you can save with fewer questions, this just tracks it).
const QUESTION_TARGET = 3;

export type InterviewPrepFormDefaults = {
  prepNotes?: string;
  companyResearch?: string;
  likelyQuestions?: LikelyQuestion[];
  starStories?: StarStory[];
};

export function InterviewPrepForm({
  action,
  generateAction,
  hasJobDescription,
  hasLinkedResume,
  defaultValues,
}: {
  action: (
    prevState: InterviewPrepActionState,
    formData: FormData,
  ) => Promise<InterviewPrepActionState>;
  generateAction: (
    prevState: GenerateInterviewPrepState,
    formData: FormData,
  ) => Promise<GenerateInterviewPrepState>;
  hasJobDescription: boolean;
  hasLinkedResume: boolean;
  defaultValues?: InterviewPrepFormDefaults;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [generateState, generateFormAction, isGenerating] = useActionState(
    generateAction,
    undefined,
  );

  const [companyResearch, setCompanyResearch] = useState(
    defaultValues?.companyResearch ?? "",
  );
  const [questions, setQuestions] = useState<LikelyQuestion[]>(
    defaultValues?.likelyQuestions ?? [],
  );
  const [stories, setStories] = useState<StarStory[]>(
    defaultValues?.starStories ?? [],
  );

  // Merge freshly generated content into the editable state — additive,
  // never replacing existing questions/stories, and appending (not
  // overwriting) company research if some was already written. Nothing
  // touches the database here; the user still has to click "Save interview
  // prep" below, same as any manual edit.
  //
  // This runs during render (comparing against the last-handled state),
  // not in a useEffect, per React's guidance on adjusting state in
  // response to a prop/state change: https://react.dev/learn/you-might-not-need-an-effect
  const [handledGenerateState, setHandledGenerateState] =
    useState(generateState);
  if (generateState !== handledGenerateState) {
    setHandledGenerateState(generateState);
    if (generateState && !("error" in generateState)) {
      setQuestions((prev) => [...prev, ...generateState.likelyQuestions]);
      setStories((prev) => [...prev, ...generateState.starStoryPrompts]);
      setCompanyResearch((prev) =>
        prev.trim()
          ? `${prev}\n\n--- AI-generated prep points ---\n${generateState.companyResearch}`
          : generateState.companyResearch,
      );
    }
  }

  // Blank rows (never given a question/title) are dropped before
  // submitting, so clicking "+ Add" and then not filling it in doesn't
  // trip the server's "question is required" validation.
  const questionsJson = useMemo(
    () =>
      JSON.stringify(
        questions
          .map((q) => ({
            question: q.question.trim(),
            notes: q.notes?.trim() || undefined,
            practiced: q.practiced,
          }))
          .filter((q) => q.question.length > 0),
      ),
    [questions],
  );

  const storiesJson = useMemo(
    () =>
      JSON.stringify(
        stories
          .map((s) => ({
            title: s.title.trim(),
            situation: s.situation?.trim() || undefined,
            task: s.task?.trim() || undefined,
            action: s.action?.trim() || undefined,
            result: s.result?.trim() || undefined,
            ready: s.ready,
          }))
          .filter((s) => s.title.length > 0),
      ),
    [stories],
  );

  const meaningfulQuestions = useMemo(
    () => questions.filter((q) => q.question.trim().length > 0),
    [questions],
  );
  const meaningfulStories = useMemo(
    () => stories.filter((s) => s.title.trim().length > 0),
    [stories],
  );
  const practicedCount = meaningfulQuestions.filter((q) => q.practiced).length;
  const readyCount = meaningfulStories.filter((s) => s.ready).length;

  const checklistItems: ChecklistItem[] = [
    { label: "Job description added", done: hasJobDescription },
    { label: "Resume linked", done: hasLinkedResume },
    {
      label: "Company research added",
      done: companyResearch.trim().length > 0,
    },
    {
      label: `At least ${QUESTION_TARGET} questions prepared`,
      done: meaningfulQuestions.length >= QUESTION_TARGET,
      detail: `${meaningfulQuestions.length} of ${QUESTION_TARGET}`,
    },
    {
      label: "At least one STAR story drafted",
      done: meaningfulStories.length >= 1,
      detail: `${meaningfulStories.length}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <InterviewPrepChecklist items={checklistItems} />

      <form action={generateFormAction} className={cardClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-50">
              Generate with AI
            </p>
            <p className="text-xs text-zinc-400">
              Uses this application&apos;s company, role, job description,
              and linked resume (if any) to suggest questions, prep points,
              and STAR story prompts. Adds to what&apos;s below — nothing is
              saved until you click Save.
            </p>
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="shrink-0 rounded-full btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {isGenerating ? "Generating…" : "Generate interview prep"}
          </button>
        </div>
        {generateState && "error" in generateState ? (
          <p className="text-sm text-red-400">
            {generateState.error}
          </p>
        ) : null}
      </form>

      <form action={formAction} className="flex flex-col gap-6">
        <div className={cardClass}>
          <h2 className="text-sm font-medium text-zinc-50">
            Prep notes
          </h2>
          <textarea
            name="prepNotes"
            rows={6}
            defaultValue={defaultValues?.prepNotes}
            placeholder="General notes, talking points, things to remember…"
            className={fieldClass}
          />
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-medium text-zinc-50">
            Company research
          </h2>
          <textarea
            name="companyResearch"
            rows={6}
            value={companyResearch}
            onChange={(event) => setCompanyResearch(event.target.value)}
            placeholder="Mission, recent news, culture, products…"
            className={fieldClass}
          />
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-50">
              Likely interview questions
              {meaningfulQuestions.length > 0 ? (
                <span className="ml-2 font-normal text-zinc-400">
                  {practicedCount} of {meaningfulQuestions.length} practiced
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              onClick={() =>
                setQuestions((prev) => [
                  ...prev,
                  { question: "", notes: "", practiced: false },
                ])
              }
              className="text-sm text-zinc-50 hover:underline"
            >
              + Add question
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No questions added yet. Add one manually, or use{" "}
              <span className="font-medium">Generate with AI</span> above.
            </p>
          ) : null}

          {questions.map((question, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 glass-card p-4"
            >
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={question.question}
                  onChange={(event) =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, question: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="e.g. Tell me about a time you handled conflict."
                  className={`flex-1 ${fieldClass}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuestions((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-sm text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={question.notes ?? ""}
                onChange={(event) =>
                  setQuestions((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? { ...item, notes: event.target.value }
                        : item,
                    ),
                  )
                }
                rows={2}
                placeholder="Notes on how you'd answer (optional)"
                className={fieldClass}
              />
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={question.practiced}
                  onChange={(event) =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, practiced: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Practiced
              </label>
            </div>
          ))}
          <input
            type="hidden"
            name="likelyQuestionsJson"
            value={questionsJson}
          />
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-50">
              STAR stories
              {meaningfulStories.length > 0 ? (
                <span className="ml-2 font-normal text-zinc-400">
                  {readyCount} of {meaningfulStories.length} ready
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              onClick={() =>
                setStories((prev) => [
                  ...prev,
                  {
                    title: "",
                    situation: "",
                    task: "",
                    action: "",
                    result: "",
                    ready: false,
                  },
                ])
              }
              className="text-sm text-zinc-50 hover:underline"
            >
              + Add story
            </button>
          </div>

          {stories.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No STAR stories added yet. Add one manually, or generate
              starter prompts above and fill in the details.
            </p>
          ) : null}

          {stories.map((story, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 glass-card p-4"
            >
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={story.title}
                  onChange={(event) =>
                    setStories((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Story title, e.g. Production outage recovery"
                  className={`flex-1 ${fieldClass}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setStories((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-sm text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STAR_FIELDS.map((field) => (
                  <label
                    key={field}
                    className="flex flex-col gap-1 text-xs capitalize text-zinc-400"
                  >
                    {field}
                    <textarea
                      value={story[field] ?? ""}
                      onChange={(event) =>
                        setStories((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, [field]: event.target.value }
                              : item,
                          ),
                        )
                      }
                      rows={2}
                      className={fieldClass}
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={story.ready}
                  onChange={(event) =>
                    setStories((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, ready: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Ready to tell
              </label>
            </div>
          ))}
          <input type="hidden" name="starStoriesJson" value={storiesJson} />
        </div>

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
          {isPending ? "Saving…" : "Save interview prep"}
        </button>
      </form>
    </div>
  );
}
