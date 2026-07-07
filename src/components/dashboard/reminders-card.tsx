import Link from "next/link";
import { formatDisplayDate } from "@/lib/date";
import { ReminderActions } from "@/components/dashboard/reminder-actions";

export type ReminderTask = {
  id: string;
  title: string;
  reminderAt: Date | null;
  applicationId: string;
  application: { company: string; role: string };
};

type Tone = "overdue" | "today" | "upcoming";

function ReminderRow({ task, tone }: { task: ReminderTask; tone: Tone }) {
  const toneClass =
    tone === "overdue"
      ? "font-medium text-red-400"
      : tone === "today"
        ? "font-medium text-amber-300"
        : "text-zinc-400";

  return (
    <li className="flex items-center justify-between gap-4 py-2 text-sm">
      <div>
        <Link
          href={`/dashboard/applications/${task.applicationId}/tasks`}
          className="font-medium text-zinc-50 hover:underline"
        >
          {task.title}
        </Link>
        <p className="text-xs text-zinc-400">
          {task.application.role} at {task.application.company}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-xs ${toneClass}`}>
          {tone === "overdue" ? "Overdue · " : tone === "today" ? "Today · " : ""}
          {formatDisplayDate(task.reminderAt)}
        </span>
        <ReminderActions applicationId={task.applicationId} id={task.id} />
      </div>
    </li>
  );
}

export function RemindersCard({
  overdue,
  dueToday,
  upcoming,
}: {
  overdue: ReminderTask[];
  dueToday: ReminderTask[];
  upcoming: ReminderTask[];
}) {
  const total = overdue.length + dueToday.length + upcoming.length;

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-zinc-50">
          Reminders
        </h2>
        <div className="flex items-center gap-3 text-xs">
          {overdue.length > 0 ? (
            <span className="font-medium text-red-400">
              {overdue.length} overdue
            </span>
          ) : null}
          {dueToday.length > 0 ? (
            <span className="font-medium text-amber-300">
              {dueToday.length} due today
            </span>
          ) : null}
          <Link
            href="/dashboard/settings"
            className="text-zinc-400 hover:underline"
          >
            Email settings
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-zinc-400">
          No active reminders. You&apos;re all caught up.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/10">
          {overdue.map((task) => (
            <ReminderRow key={task.id} task={task} tone="overdue" />
          ))}
          {dueToday.map((task) => (
            <ReminderRow key={task.id} task={task} tone="today" />
          ))}
          {upcoming.map((task) => (
            <ReminderRow key={task.id} task={task} tone="upcoming" />
          ))}
        </ul>
      )}
    </div>
  );
}
