import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { createTask } from "./actions";
import { TaskForm } from "@/components/applications/task-form";
import { TasksTable } from "@/components/applications/tasks-table";
import { StatusBadge } from "@/components/applications/status-badge";
import { sortTasksForDisplay } from "@/lib/task-status";

export default async function ApplicationTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const application = await prisma.application.findFirst({
    where: { id, userId },
  });

  if (!application) {
    notFound();
  }

  const tasks = sortTasksForDisplay(
    await prisma.task.findMany({
      where: { applicationId: id, userId },
      orderBy: { createdAt: "asc" },
    }),
  );

  const boundCreateTask = createTask.bind(null, application.id);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Tasks &amp; reminders
        </h1>
        <Link
          href={`/dashboard/applications/${application.id}/edit`}
          className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to application
        </Link>
      </div>

      <div className="max-w-2xl rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-black dark:text-zinc-50">
              {application.role}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {application.company}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="max-w-2xl">
        <TaskForm action={boundCreateTask} />
      </div>

      {tasks.length === 0 ? (
        <div className="max-w-2xl flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-zinc-700 dark:text-zinc-300">
            No tasks yet. Add a follow-up reminder above — e.g. a thank-you
            email, company research, or a check-back date — so it doesn&apos;t
            slip through the cracks.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl">
          <TasksTable applicationId={application.id} tasks={tasks} />
        </div>
      )}
    </div>
  );
}
