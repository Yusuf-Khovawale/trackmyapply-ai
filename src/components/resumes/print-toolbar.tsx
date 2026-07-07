"use client";

import type { StructuredResume } from "@/lib/validation/resume-structured";
import { structuredToLatex } from "@/lib/resume-render";

export function PrintToolbar({
  structured,
}: {
  structured: StructuredResume | null;
}) {
  const downloadTex = () => {
    if (!structured) return;
    const blob = new Blob([structuredToLatex(structured)], {
      type: "application/x-tex",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume.tex";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="no-print flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="btn-primary rounded-full px-5 py-2 text-sm"
      >
        Download PDF
      </button>
      {structured ? (
        <button
          type="button"
          onClick={downloadTex}
          className="btn-secondary rounded-full px-5 py-2 text-sm"
        >
          Download .tex
        </button>
      ) : null}
      <p className="w-full text-xs text-zinc-500">
        &quot;Download PDF&quot; opens your browser&apos;s print dialog —
        choose &quot;Save as PDF&quot; as the destination. The .tex file
        compiles as-is in Overleaf.
      </p>
    </div>
  );
}
