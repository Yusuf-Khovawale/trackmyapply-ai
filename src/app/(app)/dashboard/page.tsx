import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingTasksCard } from "@/components/dashboard/upcoming-tasks-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { RemindersCard } from "@/components/dashboard/reminders-card";
import { StatusBreakdownChart } from "@/components/dashboard/status-breakdown-chart";
import { ApplicationsTrendChart } from "@/components/dashboard/applications-trend-chart";
import { ConversionMetricsCard } from "@/components/dashboard/conversion-metrics-card";
import {
  APPLICATION_STATUSES,
  ACTIVE_APPLICATION_STATUSES,
  type ApplicationStatusValue,
} from "@/lib/application-status";
import {
  isTaskOverdue,
  isTaskDueToday,
  isReminderOverdue,
  isReminderDueToday,
  isUnfinished,
  sortTasksForDisplay,
} from "@/lib/task-status";
import { formatDisplayDate } from "@/lib/date";

const RECENT_ITEMS_LIMIT = 5;
const UPCOMING_REMINDERS_LIMIT = 5;

const APPLICATION_FILTERS = ["active", "interview", "offer"] as const;
// "open-tasks" backs the Upcoming tasks card's "View all" link — same
// compact drill-down panel as overdue/due-today, just unfiltered by date.
const TASK_FILTERS = ["overdue-tasks", "due-today-tasks", "open-tasks"] as const;
const DASHBOARD_FILTERS = [...APPLICATION_FILTERS, ...TASK_FILTERS] as const;
type DashboardFilter = (typeof DASHBOARD_FILTERS)[number];

const FILTER_LABELS: Record<DashboardFilter, string> = {
  active: "Active applications",
  interview: "Interview-stage applications",
  offer: "Offers",
  "overdue-tasks": "Overdue tasks",
  "due-today-tasks": "Tasks due today",
  "open-tasks": "All open tasks",
};

function parseFilter(value: string | undefined): DashboardFilter | undefined {
  return DASHBOARD_FILTERS.includes(value as DashboardFilter)
    ? (value as DashboardFilter)
    : undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = parseFilter(rawFilter);

  const userId = await requireUserId();

  const [applications, tasks] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        resume: { select: { id: true, title: true, versionLabel: true } },
      },
    }),
    // Used for the summary counts, the overdue/due-today drill-down list,
    // and the "Upcoming tasks" card below — completedAt/createdAt/updatedAt
    // are only needed for sortTasksForDisplay's tie-breaking.
    prisma.task.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        dueDate: true,
        reminderAt: true,
        reminderDismissedAt: true,
        status: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        applicationId: true,
        application: { select: { company: true, role: true } },
      },
    }),
  ]);

  const activeApplications = applications.filter((application) =>
    ACTIVE_APPLICATION_STATUSES.includes(application.status),
  ).length;
  const interviewCount = applications.filter(
    (application) => application.status === "INTERVIEW",
  ).length;
  const offerCount = applications.filter(
    (application) => application.status === "OFFER",
  ).length;
  const overdueTasks = tasks.filter(isTaskOverdue);
  const dueTodayTasks = tasks.filter(isTaskDueToday);

  // Reminders surface (Milestone 7 Batch 2): unfinished tasks with a
  // reminderAt set, bucketed with the same overdue/today helpers added in
  // Batch 1 — reuses the already-fetched, userId-scoped `tasks` array, no
  // new query. Overdue and due-today are shown in full (they're the
  // actionable-now set); upcoming is a short, soonest-first extension.
  // Batch 3: dismissed reminders are excluded from this surface without
  // touching reminderAt/dueDate/status — the underlying task is untouched.
  const tasksWithReminders = tasks.filter(
    (task) =>
      task.reminderAt && !task.reminderDismissedAt && isUnfinished(task.status),
  );
  const overdueReminders = tasksWithReminders
    .filter(isReminderOverdue)
    .sort((a, b) => a.reminderAt!.getTime() - b.reminderAt!.getTime());
  const dueTodayReminders = tasksWithReminders.filter(isReminderDueToday);
  const upcomingReminders = tasksWithReminders
    .filter((task) => !isReminderOverdue(task) && !isReminderDueToday(task))
    .sort((a, b) => a.reminderAt!.getTime() - b.reminderAt!.getTime())
    .slice(0, UPCOMING_REMINDERS_LIMIT);

  // Status breakdown chart: count per status, all 7 always present (even at
  // 0) so the chart's row order/height never shifts as data changes.
  const statusCounts = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<ApplicationStatusValue, number>,
  );
  for (const application of applications) {
    statusCounts[application.status] += 1;
  }

  // Conversion rates. Definitions (computed from each application's current
  // status only — there's no stage-history log, just a single status field,
  // so these are a snapshot proxy, not a true historical funnel):
  //   - "Applied"          = status !== SAVED (SAVED means never submitted).
  //   - "Reached interview" = status is INTERVIEW or OFFER (OFFER implies
  //     having passed the interview stage in the pipeline's ordering).
  //   - "Offer"            = status === OFFER.
  // A REJECTED/WITHDRAWN application that was, in reality, interviewed
  // before being rejected is not counted as "reached interview" here, since
  // that history isn't tracked — only its final status is.
  const appliedCount = applications.filter(
    (application) => application.status !== "SAVED",
  ).length;
  const reachedInterviewCount = applications.filter(
    (application) =>
      application.status === "INTERVIEW" || application.status === "OFFER",
  ).length;

  // Percentages are rounded to whole numbers — with typical per-user volumes
  // (a handful to a few dozen applications), a decimal place would imply
  // more precision than the sample size supports.
  const toRate = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round((numerator / denominator) * 100) : null;

  const conversionMetrics = [
    {
      label: "Application → Interview",
      value: toRate(reachedInterviewCount, appliedCount),
      detail: `${reachedInterviewCount} of ${appliedCount} applied`,
    },
    {
      label: "Application → Offer",
      value: toRate(offerCount, appliedCount),
      detail: `${offerCount} of ${appliedCount} applied`,
    },
    {
      label: "Interview → Offer",
      value: toRate(offerCount, reachedInterviewCount),
      detail: `${offerCount} of ${reachedInterviewCount} interviewed`,
    },
  ];

  // Open tasks: unfinished tasks only, overdue first, then due today, then
  // upcoming due dates, then no-due-date tasks — exactly sortTasksForDisplay's
  // ordering, applied to a pre-filtered unfinished-only set so no finished
  // tasks can appear. Upcoming tasks (dashboard card) is just its top 5;
  // the "open-tasks" filter view below shows the full list.
  const openTasks = sortTasksForDisplay(
    tasks.filter((task) => isUnfinished(task.status)),
  );
  const upcomingTasks = openTasks.slice(0, RECENT_ITEMS_LIMIT);

  // Recent activity: the same already-fetched applications, just re-ordered
  // by updatedAt so both recently-created and recently-edited applications
  // surface (a fresh row's updatedAt equals its createdAt).
  const recentApplications = [...applications]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, RECENT_ITEMS_LIMIT);

  const displayedApplications = (() => {
    switch (filter) {
      case "active":
        return applications.filter((application) =>
          ACTIVE_APPLICATION_STATUSES.includes(application.status),
        );
      case "interview":
        return applications.filter(
          (application) => application.status === "INTERVIEW",
        );
      case "offer":
        return applications.filter(
          (application) => application.status === "OFFER",
        );
      default:
        return applications;
    }
  })();

  const taskDrilldown =
    filter === "overdue-tasks"
      ? overdueTasks
      : filter === "due-today-tasks"
        ? dueTodayTasks
        : filter === "open-tasks"
          ? openTasks
          : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total applications"
          value={applications.length}
          href="/dashboard"
          active={!filter}
        />
        <StatCard
          label="Active"
          value={activeApplications}
          href="/dashboard?filter=active"
          active={filter === "active"}
        />
        <StatCard
          label="Interviews"
          value={interviewCount}
          href="/dashboard?filter=interview"
          active={filter === "interview"}
        />
        <StatCard
          label="Offers"
          value={offerCount}
          href="/dashboard?filter=offer"
          active={filter === "offer"}
        />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks.length}
          tone={overdueTasks.length > 0 ? "warning" : "neutral"}
          href="/dashboard?filter=overdue-tasks"
          active={filter === "overdue-tasks"}
        />
        <StatCard
          label="Due today"
          value={dueTodayTasks.length}
          tone={dueTodayTasks.length > 0 ? "attention" : "neutral"}
          href="/dashboard?filter=due-today-tasks"
          active={filter === "due-today-tasks"}
        />
      </div>

      <RemindersCard
        overdue={overdueReminders}
        dueToday={dueTodayReminders}
        upcoming={upcomingReminders}
      />

      <StatusBreakdownChart counts={statusCounts} />

      <ApplicationsTrendChart
        createdDates={applications.map((application) => application.createdAt)}
      />

      <ConversionMetricsCard metrics={conversionMetrics} />

      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingTasksCard
          tasks={upcomingTasks}
          totalCount={openTasks.length}
          viewAllHref="/dashboard?filter=open-tasks"
        />
        <RecentActivityCard
          applications={recentApplications}
          totalCount={applications.length}
          viewAllHref="/dashboard#applications-list"
        />
      </div>

      {taskDrilldown ? (
        <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-black dark:text-zinc-50">
              {FILTER_LABELS[filter as DashboardFilter]}
            </h2>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Clear
            </Link>
          </div>

          {taskDrilldown.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "overdue-tasks"
                ? "No overdue tasks."
                : filter === "due-today-tasks"
                  ? "No tasks due today."
                  : "No open tasks. You're all caught up."}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/[.08] dark:divide-white/[.145]">
              {taskDrilldown.map((task) => {
                const overdue = isTaskOverdue(task);
                const dueToday = isTaskDueToday(task);
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
                    <span
                      className={
                        overdue
                          ? "text-xs font-medium text-red-600 dark:text-red-400"
                          : dueToday
                            ? "text-xs font-medium text-amber-700 dark:text-amber-400"
                            : "text-xs text-zinc-600 dark:text-zinc-400"
                      }
                    >
                      {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
                      {formatDisplayDate(task.dueDate)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div
        id="applications-list"
        className="flex flex-wrap items-center justify-between gap-4 scroll-mt-8"
      >
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Applications
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {filter && APPLICATION_FILTERS.includes(filter as (typeof APPLICATION_FILTERS)[number]) ? (
              <>
                {displayedApplications.length}{" "}
                {displayedApplications.length === 1
                  ? "application"
                  : "applications"}{" "}
                · {FILTER_LABELS[filter]} ·{" "}
                <Link href="/dashboard" className="underline">
                  Clear
                </Link>
              </>
            ) : (
              <>
                {applications.length}{" "}
                {applications.length === 1 ? "application" : "applications"}{" "}
                tracked
              </>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/applications/new"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Add application
        </Link>
      </div>

      {displayedApplications.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-zinc-700 dark:text-zinc-300">
            {applications.length === 0
              ? "No applications yet. Add your first one to start tracking your job search."
              : "No applications match this filter."}
          </p>
          {applications.length === 0 ? (
            <Link
              href="/dashboard/applications/new"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Add your first application
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm text-black underline dark:text-zinc-50"
            >
              Clear filter
            </Link>
          )}
        </div>
      ) : (
        <ApplicationsTable applications={displayedApplications} />
      )}
    </div>
  );
}
