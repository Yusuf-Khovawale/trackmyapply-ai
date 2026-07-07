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
    <div className="flex flex-col gap-2 glass-card p-4">
      <h2 className="text-sm font-medium text-zinc-400">
        {title}
      </h2>
      <p
        className={`overflow-y-auto whitespace-pre-wrap text-sm ${maxHeightClassName} ${
          hasContent
            ? "text-zinc-300"
            : "text-zinc-500 italic"
        }`}
      >
        {hasContent ? content : emptyText}
      </p>
    </div>
  );
}
