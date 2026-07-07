import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { StatusSelect } from "@/components/applications/status-select";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { formatDisplayDate } from "@/lib/date";

export type ApplicationWithResume = Prisma.ApplicationGetPayload<{
  include: {
    resume: { select: { id: true; title: true; versionLabel: true } };
  };
}>;

function resumeCell(application: ApplicationWithResume) {
  if (application.resume) {
    const label = application.resume.versionLabel
      ? `${application.resume.title} — ${application.resume.versionLabel}`
      : application.resume.title;
    return (
      <Link
        href={`/dashboard/resumes/${application.resume.id}/edit`}
        className="hover:underline"
      >
        {label}
      </Link>
    );
  }
  if (application.resumeVersion) {
    return <>{application.resumeVersion}</>;
  }
  return <>—</>;
}

export function ApplicationsTable({
  applications,
}: {
  applications: ApplicationWithResume[];
}) {
  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date applied</th>
            <th className="px-4 py-3 font-medium">Resume</th>
            <th className="px-4 py-3 font-medium">Follow up</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/[.04]"
            >
              <td className="px-4 py-3 font-medium text-zinc-50">
                {application.jobUrl ? (
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {application.company}
                  </a>
                ) : (
                  application.company
                )}
              </td>
              <td className="px-4 py-3 text-zinc-300">
                {application.role}
              </td>
              <td className="px-4 py-3">
                <StatusSelect id={application.id} status={application.status} />
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {formatDisplayDate(application.dateApplied)}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {resumeCell(application)}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {formatDisplayDate(application.followUpDate)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/applications/${application.id}/edit`}
                    className="text-sm text-zinc-50 hover:underline"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/applications/${application.id}/tailor`}
                    className="text-sm text-zinc-50 hover:underline"
                  >
                    Tailor
                  </Link>
                  <Link
                    href={`/dashboard/applications/${application.id}/interview-prep`}
                    className="text-sm text-zinc-50 hover:underline"
                  >
                    Prep
                  </Link>
                  <Link
                    href={`/dashboard/applications/${application.id}/tasks`}
                    className="text-sm text-zinc-50 hover:underline"
                  >
                    Tasks
                  </Link>
                  <DeleteApplicationButton id={application.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
