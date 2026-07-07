import type { StructuredResume } from "@/lib/validation/resume-structured";

// A4-proportioned, ATS-friendly resume sheet. Deliberately rendered on a
// white surface (even in the dark app) because this is exactly what prints.
export function ResumeSheet({
  structured,
  fallbackText,
}: {
  structured: StructuredResume | null;
  fallbackText: string | null;
}) {
  if (!structured) {
    return (
      <div className="print-sheet mx-auto w-full max-w-[794px] rounded-xl bg-white p-10 text-[13px] leading-relaxed text-zinc-900 shadow-2xl">
        <pre className="whitespace-pre-wrap font-sans">{fallbackText ?? "This resume has no content."}</pre>
      </div>
    );
  }

  const c = structured.contact;
  const contactBits = [c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio].filter(Boolean);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-5">
      <h2 className="border-b border-zinc-300 pb-1 text-[13px] font-bold uppercase tracking-wider text-zinc-900">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-2.5">{children}</div>
    </section>
  );

  return (
    <div className="print-sheet mx-auto w-full max-w-[794px] rounded-xl bg-white p-10 text-[13px] leading-snug text-zinc-800 shadow-2xl">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {c.name || "Your Name"}
        </h1>
        {structured.headline ? (
          <p className="mt-0.5 text-sm text-zinc-700">{structured.headline}</p>
        ) : null}
        {contactBits.length > 0 ? (
          <p className="mt-1 text-xs text-zinc-600">{contactBits.join("  |  ")}</p>
        ) : null}
      </header>

      {structured.summary ? (
        <Section title="Summary">
          <p>{structured.summary}</p>
        </Section>
      ) : null}

      {structured.skills.length > 0 ? (
        <Section title="Skills">
          {structured.skills.map((group, index) => (
            <p key={index}>
              {group.category ? (
                <span className="font-semibold text-zinc-900">{group.category}: </span>
              ) : null}
              {group.items.join(", ")}
            </p>
          ))}
        </Section>
      ) : null}

      {structured.experience.length > 0 ? (
        <Section title="Experience">
          {structured.experience.map((job, index) => (
            <div key={index}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-semibold text-zinc-900">{job.title}</p>
                <p className="shrink-0 text-xs text-zinc-600">{job.dates}</p>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <p className="italic text-zinc-700">{job.company}</p>
                {job.location ? (
                  <p className="shrink-0 text-xs text-zinc-600">{job.location}</p>
                ) : null}
              </div>
              {job.bullets.length > 0 ? (
                <ul className="mt-1 list-disc pl-5">
                  {job.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {structured.projects.length > 0 ? (
        <Section title="Projects">
          {structured.projects.map((project, index) => (
            <div key={index}>
              <p>
                <span className="font-semibold text-zinc-900">{project.name}</span>
                {project.tech ? <span className="italic text-zinc-600"> — {project.tech}</span> : null}
              </p>
              {project.bullets.length > 0 ? (
                <ul className="mt-1 list-disc pl-5">
                  {project.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {structured.education.length > 0 ? (
        <Section title="Education">
          {structured.education.map((edu, index) => (
            <div key={index}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-semibold text-zinc-900">{edu.degree}</p>
                <p className="shrink-0 text-xs text-zinc-600">{edu.dates}</p>
              </div>
              <p className="italic text-zinc-700">{edu.school}</p>
              {edu.details ? <p className="text-xs text-zinc-600">{edu.details}</p> : null}
            </div>
          ))}
        </Section>
      ) : null}

      {structured.certifications.length > 0 ? (
        <Section title="Certifications">
          <ul className="list-disc pl-5">
            {structured.certifications.map((cert, index) => (
              <li key={index}>{cert}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
