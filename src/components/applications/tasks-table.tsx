import type { Task } from "@/generated/prisma/client";
import { TaskRow } from "@/components/applications/task-row";

export function TasksTable({
  applicationId,
  tasks,
}: {
  applicationId: string;
  tasks: Task[];
}) {
  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Due date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow key={task.id} applicationId={applicationId} task={task} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
