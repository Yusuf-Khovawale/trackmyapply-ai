import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import {
  structuredResumeSchema,
  type StructuredResume,
} from "@/lib/validation/resume-structured";
import { ResumeSheet } from "@/components/resumes/resume-sheet";
import { PrintToolbar } from "@/components/resumes/print-toolbar";

export default async function ResumePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const resume = await prisma.resume.findFirst({
    where: { id, userId },
  });
  if (!resume) {
    notFound();
  }

  let structured: StructuredResume | null = null;
  if (resume.structured) {
    const parsed = structuredResumeSchema.safeParse(resume.structured);
    structured = parsed.success ? parsed.data : null;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      {/* Print stylesheet: hide the app chrome, print only the sheet. */}
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: #ffffff !important; }
          body::before { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: none !important;
            padding: 0 !important;
          }
        }
        @page { margin: 14mm; }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {resume.title}
          </h1>
          {resume.matchScore != null ? (
            <p className="mt-1 text-sm text-zinc-400">
              JD match score:{" "}
              <span className="font-semibold text-green-300">
                {resume.matchScore}%
              </span>
              {resume.baseScore != null ? (
                <> (base resume was {resume.baseScore}%)</>
              ) : null}
            </p>
          ) : null}
          <Link
            href={`/dashboard/resumes/${resume.id}/edit`}
            className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
          >
            ← Edit resume
          </Link>
        </div>
        <PrintToolbar structured={structured} />
      </div>

      <ResumeSheet structured={structured} fallbackText={resume.content} />
    </div>
  );
}
