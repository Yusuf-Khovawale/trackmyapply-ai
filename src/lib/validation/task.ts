import { z } from "zod";
import { TASK_STATUSES } from "@/lib/task-status";

export const taskStatusSchema = z.enum(TASK_STATUSES);

const emptyToUndefined = (value: unknown) =>
  value === null || (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;

const optionalDateInput = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
);

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Action is required.").max(200),
  dueDate: optionalDateInput,
  reminderAt: optionalDateInput,
  status: taskStatusSchema,
});

export type TaskInput = z.infer<typeof taskInputSchema>;

// Batch 2: editing an existing task's title/due date only — status changes
// go through updateTaskStatus instead, so this omits `status` rather than
// duplicating the field.
export const taskEditInputSchema = taskInputSchema.omit({ status: true });

export type TaskEditInput = z.infer<typeof taskEditInputSchema>;
