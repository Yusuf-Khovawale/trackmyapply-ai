import {
  STATUS_LABELS,
  STATUS_STYLES,
  type ApplicationStatusValue,
} from "@/lib/application-status";

export function StatusBadge({ status }: { status: ApplicationStatusValue }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
