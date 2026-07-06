export type ChecklistItem = {
  label: string;
  done: boolean;
  detail?: string;
};

export function InterviewPrepChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((item) => item.done).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-black dark:text-zinc-50">
          Readiness checklist
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {doneCount} of {items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none ${
                item.done
                  ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-500"
                  : "border-black/[.2] text-transparent dark:border-white/[.3]"
              }`}
            >
              ✓
            </span>
            <span
              className={
                item.done
                  ? "text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {item.label}
              {item.detail ? ` (${item.detail})` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
