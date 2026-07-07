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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Tasks &amp; reminders
        </h1>
        <Link
          href={`/dashboard/applications/${application.id}/edit`}
          className="mt-1 inline-block text-sm text-zinc-400 hover:underline"
        >
          ← Back to application
        </Link>
      </div>

      <div className="max-w-2xl glass-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-50">
              {application.role}
            </p>
            <p className="text-sm text-zinc-400">
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
        <div className="max-w-2xl flex flex-col items-start gap-3 rounded-xl border border-dashed border-white/10 p-8">
          <p className="text-zinc-300">
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
