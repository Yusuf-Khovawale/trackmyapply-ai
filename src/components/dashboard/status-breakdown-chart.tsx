import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_CHART_BAR_CLASSES,
  type ApplicationStatusValue,
} from "@/lib/application-status";

export function StatusBreakdownChart({
  counts,
}: {
  counts: Record<ApplicationStatusValue, number>;
}) {
  const total = APPLICATION_STATUSES.reduce(
    (sum, status) => sum + counts[status],
    0,
  );
  const maxCount = Math.max(1, ...APPLICATION_STATUSES.map((s) => counts[s]));

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-50">
          Status breakdown
        </h2>
        <span className="text-xs text-zinc-400">
          {total} total
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-zinc-400">
          No applications yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {APPLICATION_STATUSES.map((status) => {
            const count = counts[status];
            const widthPercent = (count / maxCount) * 100;
            return (
              <li key={status} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-400">
                  {STATUS_LABELS[status]}
                </span>
                <span className="relative h-4 flex-1 overflow-hidden rounded bg-white/[.06]">
                  <span
                    className={`absolute inset-y-0 left-0 rounded ${STATUS_CHART_BAR_CLASSES[status]}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right font-medium text-zinc-50">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
