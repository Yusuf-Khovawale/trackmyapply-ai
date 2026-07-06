export function ContentPreview({
  title,
  content,
  emptyText = "Nothing saved yet.",
  maxHeightClassName = "max-h-56",
}: {
  title: string;
  content: string | null | undefined;
  emptyText?: string;
  maxHeightClassName?: string;
}) {
  const hasContent = Boolean(content?.trim());

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      <p
        className={`overflow-y-auto whitespace-pre-wrap text-sm ${maxHeightClassName} ${
          hasContent
            ? "text-zinc-700 dark:text-zinc-300"
            : "text-zinc-500 italic dark:text-zinc-500"
        }`}
      >
        {hasContent ? content : emptyText}
      </p>
    </div>
  );
}
