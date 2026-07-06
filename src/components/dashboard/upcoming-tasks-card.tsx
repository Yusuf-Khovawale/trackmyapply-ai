import Link from "next/link";
import {
  isTaskOverdue,
  isTaskDueToday,
  isReminderOverdue,
  isReminderDueToday,
  type TaskStatusValue,
} from "@/lib/task-status";
import { formatDisplayDate } from "@/lib/date";
import { MarkTaskDoneButton } from "@/components/dashboard/mark-task-done-button";

export type UpcomingTask = {
  id: string;
  title: string;
  dueDate: Date | null;
  reminderAt: Date | null;
  status: TaskStatusValue;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  applicationId: string;
  application: { company: string; role: string };
};

export function UpcomingTasksCard({
  tasks,
  totalCount,
  viewAllHref,
}: {
  tasks: UpcomingTask[];
  totalCount: number;
  viewAllHref: string;
}) {
  const remaining = totalCount - tasks.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-black dark:text-zinc-50">
          Upcoming tasks
        </h2>
        <div className="flex items-center gap-2 text-xs">
          {remaining > 0 ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              +{remaining} more
            </span>
          ) : null}
          <Link
            href={viewAllHref}
            className="font-medium text-black hover:underline dark:text-zinc-50"
          >
            View all
          </Link>
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No open tasks. You&apos;re all caught up.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/[.08] dark:divide-white/[.145]">
          {tasks.map((task) => {
            const overdue = isTaskOverdue(task);
            const dueToday = isTaskDueToday(task);
            const reminderOverdue = isReminderOverdue(task);
            const reminderDueToday = isReminderDueToday(task);
            return (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/dashboard/applications/${task.applicationId}/tasks`}
                    className="font-medium text-black hover:underline dark:text-zinc-50"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {task.application.role} at {task.application.company}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`text-xs ${
                      overdue
                        ? "font-medium text-red-600 dark:text-red-400"
                        : dueToday
                          ? "font-medium text-amber-700 dark:text-amber-400"
                          : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
                    {formatDisplayDate(task.dueDate)}
                  </span>
                  {task.reminderAt ? (
                    <span
                      className={`text-xs ${
                        reminderOverdue
                          ? "font-medium text-red-600 dark:text-red-400"
                          : reminderDueToday
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      Reminder {formatDisplayDate(task.reminderAt)}
                    </span>
                  ) : null}
                  <MarkTaskDoneButton
                    applicationId={task.applicationId}
                    id={task.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
