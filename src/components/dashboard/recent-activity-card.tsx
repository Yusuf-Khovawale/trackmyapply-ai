import Link from "next/link";
import { StatusBadge } from "@/components/applications/status-badge";
import { formatDisplayDate } from "@/lib/date";
import type { ApplicationStatusValue } from "@/lib/application-status";

export type RecentApplication = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatusValue;
  updatedAt: Date;
};

export function RecentActivityCard({
  applications,
  totalCount,
  viewAllHref,
}: {
  applications: RecentApplication[];
  totalCount: number;
  viewAllHref: string;
}) {
  const remaining = totalCount - applications.length;

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-50">
          Recent activity
        </h2>
        <div className="flex items-center gap-2 text-xs">
          {remaining > 0 ? (
            <span className="text-zinc-400">
              +{remaining} more
            </span>
          ) : null}
          <Link
            href={viewAllHref}
            className="font-medium text-zinc-50 hover:underline"
          >
            View all
          </Link>
        </div>
      </div>
      {applications.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No applications yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/10">
          {applications.map((application) => (
            <li
              key={application.id}
              className="flex items-center justify-between gap-4 py-2 text-sm"
            >
              <div>
                <Link
                  href={`/dashboard/applications/${application.id}/edit`}
                  className="font-medium text-zinc-50 hover:underline"
                >
                  {application.role}
                </Link>
                <p className="text-xs text-zinc-400">
                  {application.company}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={application.status} />
                <span className="text-xs text-zinc-400">
                  {formatDisplayDate(application.updatedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
