import Link from "next/link";
import type { Resume } from "@/generated/prisma/client";
import { DeleteResumeButton } from "@/components/resumes/delete-resume-button";
import { formatDisplayDate } from "@/lib/date";

export function ResumesTable({ resumes }: { resumes: Resume[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-black/[.08] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
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
              className="border-b border-black/[.08] last:border-0 dark:border-white/[.145]"
            >
              <td className="px-4 py-3 font-medium text-black dark:text-zinc-50">
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
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {resume.versionLabel ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {resume.baseRole ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {formatDisplayDate(resume.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/resumes/${resume.id}/edit`}
                    className="text-sm text-black hover:underline dark:text-zinc-50"
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
