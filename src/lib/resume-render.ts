import type { StructuredResume } from "@/lib/validation/resume-structured";

// ---------------------------------------------------------------------
// Plain-text rendering — stored in Resume.content so every existing
// surface (previews, edit page, re-tailoring) keeps working unchanged.
// ---------------------------------------------------------------------
export function structuredToPlainText(resume: StructuredResume): string {
  const lines: string[] = [];
  const c = resume.contact;

  if (c.name) lines.push(c.name.toUpperCase());
  if (resume.headline) lines.push(resume.headline);
  const contactBits = [c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio]
    .filter(Boolean)
    .join(" | ");
  if (contactBits) lines.push(contactBits);
  lines.push("");

  if (resume.summary) {
    lines.push("SUMMARY", resume.summary, "");
  }

  if (resume.skills.length > 0) {
    lines.push("SKILLS");
    for (const group of resume.skills) {
      const items = group.items.join(", ");
      lines.push(group.category ? `${group.category}: ${items}` : items);
    }
    lines.push("");
  }

  if (resume.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const job of resume.experience) {
      const header = [job.title, job.company].filter(Boolean).join(" — ");
      const meta = [job.location, job.dates].filter(Boolean).join(" | ");
      lines.push(meta ? `${header} (${meta})` : header);
      for (const bullet of job.bullets) lines.push(`- ${bullet}`);
      lines.push("");
    }
  }

  if (resume.projects.length > 0) {
    lines.push("PROJECTS");
    for (const project of resume.projects) {
      lines.push(project.tech ? `${project.name} — ${project.tech}` : project.name);
      for (const bullet of project.bullets) lines.push(`- ${bullet}`);
      lines.push("");
    }
  }

  if (resume.education.length > 0) {
    lines.push("EDUCATION");
    for (const edu of resume.education) {
      const header = [edu.degree, edu.school].filter(Boolean).join(" — ");
      lines.push(edu.dates ? `${header} (${edu.dates})` : header);
      if (edu.details) lines.push(edu.details);
    }
    lines.push("");
  }

  if (resume.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    for (const cert of resume.certifications) lines.push(`- ${cert}`);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------
// LaTeX rendering — a clean single-file, ATS-friendly template (no custom
// .cls needed) that compiles as-is in Overleaf or any pdflatex install.
// ---------------------------------------------------------------------
function tex(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function texUrl(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function structuredToLatex(resume: StructuredResume): string {
  const c = resume.contact;
  const contactParts: string[] = [];
  if (c.phone) contactParts.push(tex(c.phone));
  if (c.email) contactParts.push(`\\href{mailto:${c.email}}{${tex(c.email)}}`);
  if (c.location) contactParts.push(tex(c.location));
  if (c.linkedin) contactParts.push(`\\href{${c.linkedin}}{${tex(texUrl(c.linkedin))}}`);
  if (c.github) contactParts.push(`\\href{${c.github}}{${tex(texUrl(c.github))}}`);
  if (c.portfolio) contactParts.push(`\\href{${c.portfolio}}{${tex(texUrl(c.portfolio))}}`);

  const sections: string[] = [];

  if (resume.summary) {
    sections.push(`\\section*{Summary}\n${tex(resume.summary)}`);
  }

  if (resume.skills.length > 0) {
    const rows = resume.skills
      .map((group) =>
        group.category
          ? `\\textbf{${tex(group.category)}:} ${tex(group.items.join(", "))}`
          : tex(group.items.join(", ")),
      )
      .join(" \\\\\n");
    sections.push(`\\section*{Skills}\n${rows}`);
  }

  if (resume.experience.length > 0) {
    const jobs = resume.experience
      .map((job) => {
        const bullets =
          job.bullets.length > 0
            ? `\\begin{itemize}[leftmargin=1.2em, itemsep=1pt, parsep=0pt, topsep=2pt]\n` +
              job.bullets.map((bullet) => `  \\item ${tex(bullet)}`).join("\n") +
              `\n\\end{itemize}`
            : "";
        return (
          `\\textbf{${tex(job.title)}} \\hfill ${tex(job.dates)} \\\\\n` +
          `\\textit{${tex(job.company)}}` +
          (job.location ? ` \\hfill ${tex(job.location)}` : "") +
          `\n${bullets}`
        );
      })
      .join("\n\\vspace{6pt}\n\n");
    sections.push(`\\section*{Experience}\n${jobs}`);
  }

  if (resume.projects.length > 0) {
    const projects = resume.projects
      .map((project) => {
        const bullets =
          project.bullets.length > 0
            ? `\\begin{itemize}[leftmargin=1.2em, itemsep=1pt, parsep=0pt, topsep=2pt]\n` +
              project.bullets.map((bullet) => `  \\item ${tex(bullet)}`).join("\n") +
              `\n\\end{itemize}`
            : "";
        return (
          `\\textbf{${tex(project.name)}}` +
          (project.tech ? ` \\textit{— ${tex(project.tech)}}` : "") +
          `\n${bullets}`
        );
      })
      .join("\n\\vspace{4pt}\n\n");
    sections.push(`\\section*{Projects}\n${projects}`);
  }

  if (resume.education.length > 0) {
    const rows = resume.education
      .map(
        (edu) =>
          `\\textbf{${tex(edu.degree)}} \\hfill ${tex(edu.dates)} \\\\\n` +
          `\\textit{${tex(edu.school)}}` +
          (edu.details ? ` \\\\\n${tex(edu.details)}` : ""),
      )
      .join("\n\\vspace{4pt}\n\n");
    sections.push(`\\section*{Education}\n${rows}`);
  }

  if (resume.certifications.length > 0) {
    sections.push(
      `\\section*{Certifications}\n\\begin{itemize}[leftmargin=1.2em, itemsep=1pt, parsep=0pt, topsep=2pt]\n` +
        resume.certifications.map((cert) => `  \\item ${tex(cert)}`).join("\n") +
        `\n\\end{itemize}`,
    );
  }

  return `% Generated by GetHired AI — compiles with pdflatex (e.g. Overleaf).
\\documentclass[10.5pt]{article}
\\usepackage[margin=0.55in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${tex(c.name || "Your Name")}} \\\\[2pt]
  ${resume.headline ? `{\\normalsize ${tex(resume.headline)}} \\\\[2pt]` : ""}
  {\\small ${contactParts.join(" \\;|\\; ")}}
\\end{center}

${sections.join("\n\n")}

\\end{document}
`;
}
