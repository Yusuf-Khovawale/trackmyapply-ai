export type ConversionMetric = {
  label: string;
  // null means the denominator was 0 — rendered as an em dash rather than a
  // misleading "0%" (there's no rate to report yet, not a measured zero).
  value: number | null;
  detail: string;
};

export function ConversionMetricsCard({
  metrics,
}: {
  metrics: ConversionMetric[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <h2 className="text-sm font-medium text-black dark:text-zinc-50">
        Conversion rates
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {metric.label}
            </span>
            <span className="text-2xl font-semibold text-black dark:text-zinc-50">
              {metric.value === null ? "—" : `${metric.value}%`}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {metric.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
