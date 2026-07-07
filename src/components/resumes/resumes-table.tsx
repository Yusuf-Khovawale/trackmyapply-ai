import Link from "next/link";
import type { Resume } from "@/generated/prisma/client";
import { DeleteResumeButton } from "@/components/resumes/delete-resume-button";
import { formatDisplayDate } from "@/lib/date";

export function ResumesTable({ resumes }: { resumes: Resume[] }) {
  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Version label</th>
            <th className="px-4 py-3 font-medium">Base role</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resumes.map((resume) => (
            <tr
              key={resume.id}
              className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/[.04]"
            >
              <td className="px-4 py-3 font-medium text-zinc-50">
                {resume.fileUrl ? (
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {resume.title}
                  </a>
                ) : (
                  resume.title
                )}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {resume.versionLabel ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {resume.baseRole ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-400">
                {formatDisplayDate(resume.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/resumes/${resume.id}/edit`}
                    className="text-sm text-zinc-50 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteResumeButton id={resume.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
