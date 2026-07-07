const WEEKS = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

type WeekBucket = {
  start: Date;
  count: number;
};

// Rolling 7-day buckets ending today (not calendar/ISO weeks) — the most
// recent bucket is "the last 7 days including today," and each earlier
// bucket is the preceding 7-day period. This avoids Monday-vs-Sunday
// week-start ambiguity and is simple to explain: "the last 8 weeks" means
// the last 56 days, chunked into 7-day periods.
function buildWeekBuckets(createdDates: Date[], weeks: number): WeekBucket[] {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const buckets: (WeekBucket & { end: Date })[] = Array.from(
    { length: weeks },
    (_, i) => {
      const end = new Date(
        startOfToday.getTime() + DAY_MS - (weeks - 1 - i) * WEEK_MS,
      );
      const start = new Date(end.getTime() - WEEK_MS);
      return { start, end, count: 0 };
    },
  );

  for (const createdAt of createdDates) {
    const time = createdAt.getTime();
    for (const bucket of buckets) {
      if (time >= bucket.start.getTime() && time < bucket.end.getTime()) {
        bucket.count += 1;
        break;
      }
    }
  }

  return buckets.map(({ start, count }) => ({ start, count }));
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Chart surface must match the page background exactly (from globals.css)
// so the dot rings sit flush against it rather than showing a mismatched
// box. Same blue hue as the status breakdown chart's APPLIED bar, reused
// here for the one series this chart plots.
const SURFACE_RING_CLASS = "stroke-[#07080d]";
const LINE_CLASS = "stroke-[#3987e5]";
const DOT_FILL_CLASS = "fill-[#3987e5]";
const AREA_FILL_CLASS = "fill-[#3987e5]/10";

export function ApplicationsTrendChart({
  createdDates,
}: {
  createdDates: Date[];
}) {
  const buckets = buildWeekBuckets(createdDates, WEEKS);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  // Week-over-week insight (Milestone 8 Batch 1, refined in Batch 2): the
  // last two buckets already computed above — no new data, no new query.
  // "Down" and "flat" stay neutral (fewer applications one week isn't a
  // problem the way an overdue task is) — only "up" gets the positive
  // green, matching how the app already reserves green for good outcomes
  // (e.g. the OFFER status badge) rather than a chart-validated palette.
  const thisWeekCount = buckets[buckets.length - 1].count;
  const lastWeekCount = buckets[buckets.length - 2].count;
  const weekOverWeekDelta = thisWeekCount - lastWeekCount;
  const weekOverWeekTone =
    weekOverWeekDelta > 0 ? "up" : weekOverWeekDelta < 0 ? "down" : "flat";
  const weekOverWeekGlyph =
    weekOverWeekTone === "up" ? "▲" : weekOverWeekTone === "down" ? "▼" : "–";
  const weekOverWeekInsight =
    weekOverWeekTone === "up"
      ? `Up ${weekOverWeekDelta} vs last week`
      : weekOverWeekTone === "down"
        ? `Down ${Math.abs(weekOverWeekDelta)} vs last week`
        : "No change vs last week";

  const width = 640;
  const height = 160;
  const marginTop = 20;
  const marginBottom = 20;
  const marginX = 12;
  const plotWidth = width - marginX * 2;
  const plotHeight = height - marginTop - marginBottom;

  const points = buckets.map((bucket, i) => {
    const x = marginX + (i / (WEEKS - 1)) * plotWidth;
    const y =
      marginTop + plotHeight - (bucket.count / maxCount) * plotHeight;
    return { x, y, count: bucket.count, label: formatWeekLabel(bucket.start) };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const baselineY = marginTop + plotHeight;
  const areaPoints = `${marginX},${baselineY} ${linePoints} ${marginX + plotWidth},${baselineY}`;

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-50">
          Applications per week
        </h2>
        <span className="text-xs text-zinc-400">
          Last {WEEKS} weeks · {total} total
        </span>
      </div>

      {total > 0 ? (
        <p
          className={`-mt-2 text-xs ${
            weekOverWeekTone === "up"
              ? "text-green-400"
              : "text-zinc-400"
          }`}
        >
          <span aria-hidden="true">{weekOverWeekGlyph}</span>{" "}
          {weekOverWeekInsight}
        </p>
      ) : null}

      {total === 0 ? (
        <p className="text-sm text-zinc-400">
          No applications added in the last {WEEKS} weeks. Add one to start
          tracking your weekly momentum.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={`Applications added per week, last ${WEEKS} weeks: ${points
            .map((p) => `${p.label}: ${p.count}`)
            .join(", ")}`}
        >
          <line
            x1={marginX}
            y1={baselineY}
            x2={marginX + plotWidth}
            y2={baselineY}
            className="stroke-white/10"
            strokeWidth={1}
          />

          <polygon points={areaPoints} className={AREA_FILL_CLASS} />

          <polyline
            points={linePoints}
            fill="none"
            className={LINE_CLASS}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                className={`${DOT_FILL_CLASS} ${SURFACE_RING_CLASS}`}
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="fill-zinc-300 text-[10px] font-medium"
              >
                {p.count}
              </text>
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                className="fill-zinc-400 text-[10px]"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
