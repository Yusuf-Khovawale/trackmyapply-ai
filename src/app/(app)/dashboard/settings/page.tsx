import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { updateEmailReminderPreference } from "./actions";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { emailRemindersEnabled: true, reminderEmailFrequency: true },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 sm:p-16">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Settings
        </h1>
        <Link
          href="/dashboard"
          className="mt-1 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to dashboard
        </Link>
      </div>

      <form
        action={updateEmailReminderPreference}
        className="flex max-w-md flex-col gap-4 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="emailRemindersEnabled"
            defaultChecked={user.emailRemindersEnabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Email me task reminders
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              At most one email per reminder per day, only for reminders
              that are overdue or due today. Off by default.
            </span>
          </span>
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Frequency
          </legend>
          <p className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Only applies while email reminders are turned on above.
          </p>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="reminderEmailFrequency"
              value="IMMEDIATE"
              defaultChecked={user.reminderEmailFrequency === "IMMEDIATE"}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Immediate
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                One email per reminder, as it becomes overdue or due today.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="reminderEmailFrequency"
              value="DAILY_DIGEST"
              defaultChecked={user.reminderEmailFrequency === "DAILY_DIGEST"}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Daily digest
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                One email per day summarizing all overdue and due-today
                reminders. Nothing is sent on days with none.
              </span>
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Save
        </button>
      </form>
    </div>
  );
}
