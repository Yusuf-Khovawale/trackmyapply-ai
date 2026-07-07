"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type ReminderNotification = {
  id: string;
  title: string;
  company: string;
  applicationId: string;
  kind: "overdue" | "today";
};

const SESSION_KEY = "gethired-notified";

// In-app notification pop-ups: when the user lands on the dashboard after
// signing in, due/overdue reminders appear as glass toasts (once per
// browser session, so navigating around the app doesn't re-spam them).
export function NotificationPopups({
  reminders,
}: {
  reminders: ReminderNotification[];
}) {
  const [visible, setVisible] = useState<ReminderNotification[]>([]);

  useEffect(() => {
    if (reminders.length === 0) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {
      // sessionStorage unavailable (rare) — still show, just once per load.
    }
    setVisible(reminders.slice(0, 4));
  }, [reminders]);

  useEffect(() => {
    if (visible.length === 0) return;
    const timer = setTimeout(() => setVisible([]), 12000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (visible.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex w-80 max-w-[calc(100vw-3rem)] flex-col gap-3"
    >
      {visible.map((reminder) => (
        <div key={reminder.id} className="glass-card flex items-start gap-3 p-4">
          <span
            aria-hidden
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              reminder.kind === "overdue" ? "bg-red-400" : "bg-amber-300"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-50">{reminder.title}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {reminder.company} ·{" "}
              {reminder.kind === "overdue" ? "overdue" : "due today"}
            </p>
            <Link
              href={`/dashboard/applications/${reminder.applicationId}/tasks`}
              className="mt-1.5 inline-block text-xs font-medium text-indigo-300 hover:underline"
            >
              Open tasks →
            </Link>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() =>
              setVisible((current) =>
                current.filter((item) => item.id !== reminder.id),
              )
            }
            className="text-zinc-500 transition-colors hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
