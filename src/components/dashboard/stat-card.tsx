import Link from "next/link";

function StatCardContent({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "warning" | "attention";
}) {
  return (
    <>
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span
        className={`text-2xl font-semibold ${
          tone === "warning"
            ? "text-red-600 dark:text-red-400"
            : tone === "attention"
              ? "text-amber-700 dark:text-amber-400"
              : "text-black dark:text-zinc-50"
        }`}
      >
        {value}
      </span>
    </>
  );
}

export function StatCard({
  label,
  value,
  tone = "neutral",
  href,
  active = false,
}: {
  label: string;
  value: number;
  // "warning" (red) for overdue-style urgency, "attention" (amber) for
  // due-today-style urgency — same color convention already used by the
  // Reminders card and task drilldown panel.
  tone?: "neutral" | "warning" | "attention";
  // When provided, the card becomes a link (e.g. a dashboard drill-down
  // filter) instead of a plain display card.
  href?: string;
  active?: boolean;
}) {
  const borderClass = active
    ? "border-black/40 dark:border-white/40"
    : "border-black/[.08] dark:border-white/[.145]";

  if (href) {
    return (
      <Link
        href={href}
        className={`flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:border-black/40 dark:hover:border-white/40 ${borderClass}`}
      >
        <StatCardContent label={label} value={value} tone={tone} />
      </Link>
    );
  }

  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${borderClass}`}>
      <StatCardContent label={label} value={value} tone={tone} />
    </div>
  );
}
