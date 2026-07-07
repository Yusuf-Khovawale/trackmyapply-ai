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
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <span
        className={`text-2xl font-semibold tracking-tight ${
          tone === "warning"
            ? "text-red-400"
            : tone === "attention"
              ? "text-amber-300"
              : "text-zinc-50"
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
  const activeClass = active
    ? "ring-1 ring-indigo-400/60 border-indigo-400/50"
    : "";

  if (href) {
    return (
      <Link
        href={href}
        className={`glass-card glass-card-hover flex flex-col gap-1 p-4 ${activeClass}`}
      >
        <StatCardContent label={label} value={value} tone={tone} />
      </Link>
    );
  }

  return (
    <div className={`glass-card flex flex-col gap-1 p-4 ${activeClass}`}>
      <StatCardContent label={label} value={value} tone={tone} />
    </div>
  );
}
