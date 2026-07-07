"use client";

import { useState } from "react";

const fieldClass = "glass-input px-3 py-2 text-sm";
const labelClass = "flex flex-col gap-1 text-sm text-zinc-300";

// Builds pre-filtered search links on the platforms where the jobs
// actually live. Deliberately link-out (no scraping): results are always
// live, and each platform applies the filters natively.
function buildLinks(input: {
  role: string;
  location: string;
  remote: string;
  level: string;
  recency: string;
}) {
  const role = input.role.trim();
  const location = input.location.trim();
  const isRemote = input.remote === "REMOTE";

  // LinkedIn
  const li = new URLSearchParams();
  li.set("keywords", role);
  if (location) li.set("location", isRemote ? "" : location);
  if (isRemote) li.set("f_WT", "2");
  if (input.remote === "HYBRID") li.set("f_WT", "3");
  const liLevel: Record<string, string> = {
    INTERNSHIP: "1",
    ENTRY: "2",
    MID: "3",
    SENIOR: "4",
    LEAD: "5",
  };
  if (liLevel[input.level]) li.set("f_E", liLevel[input.level]);
  if (input.recency === "day") li.set("f_TPR", "r86400");
  if (input.recency === "week") li.set("f_TPR", "r604800");
  const linkedin = `https://www.linkedin.com/jobs/search/?${li.toString()}`;

  // Indeed
  const indeed = new URLSearchParams();
  indeed.set("q", isRemote ? `${role} remote` : role);
  if (location && !isRemote) indeed.set("l", location);
  if (input.recency === "day") indeed.set("fromage", "1");
  if (input.recency === "week") indeed.set("fromage", "7");
  const indeedUrl = `https://www.indeed.com/jobs?${indeed.toString()}`;

  // Google Jobs
  const googleQuery = [
    role,
    "jobs",
    isRemote ? "remote" : location ? `in ${location}` : "",
    input.recency === "day" ? "posted today" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const google = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&ibp=htl;jobs`;

  return [
    { name: "LinkedIn", href: linkedin, note: "filters applied natively" },
    { name: "Indeed", href: indeedUrl, note: "filters applied natively" },
    { name: "Google Jobs", href: google, note: "aggregates every job board" },
  ];
}

export function JobFinderForm({
  defaultRole,
  defaultLocation,
  defaultRemote,
  defaultLevel,
}: {
  defaultRole: string;
  defaultLocation: string;
  defaultRemote: string;
  defaultLevel: string;
}) {
  const [role, setRole] = useState(defaultRole);
  const [location, setLocation] = useState(defaultLocation);
  const [remote, setRemote] = useState(defaultRemote || "ANY");
  const [level, setLevel] = useState(defaultLevel);
  const [recency, setRecency] = useState("week");
  const [links, setLinks] = useState<ReturnType<typeof buildLinks> | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (role.trim()) {
            setLinks(buildLinks({ role, location, remote, level, recency }));
          }
        }}
        className="glass-card flex flex-col gap-4 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Desired role *
            <input
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={fieldClass}
              placeholder="Frontend Developer"
            />
          </label>
          <label className={labelClass}>
            Location
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={fieldClass}
              placeholder="Hyderabad, India"
            />
          </label>
          <label className={labelClass}>
            Work type
            <select value={remote} onChange={(event) => setRemote(event.target.value)} className={fieldClass}>
              <option value="ANY">Any</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </label>
          <label className={labelClass}>
            Experience level
            <select value={level} onChange={(event) => setLevel(event.target.value)} className={fieldClass}>
              <option value="">Any</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="ENTRY">Entry level</option>
              <option value="MID">Mid level</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead / Manager</option>
            </select>
          </label>
          <label className={labelClass}>
            Posted within
            <select value={recency} onChange={(event) => setRecency(event.target.value)} className={fieldClass}>
              <option value="day">Last 24 hours</option>
              <option value="week">Last week</option>
              <option value="any">Any time</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="btn-primary self-start rounded-full px-6 py-2.5 text-sm"
        >
          Find matching jobs
        </button>
      </form>

      {links ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {links.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card glass-card-hover flex flex-col gap-1 p-5"
            >
              <span className="text-sm font-semibold text-zinc-50">
                {platform.name} →
              </span>
              <span className="text-xs text-zinc-400">{platform.note}</span>
            </a>
          ))}
          <p className="text-xs text-zinc-500 sm:col-span-3">
            Each link opens the platform&apos;s live search, pre-filtered to
            your preferences. Found one you like? Add it as an application
            and let the AI tailor your resume to its JD.
          </p>
        </div>
      ) : null}
    </div>
  );
}
