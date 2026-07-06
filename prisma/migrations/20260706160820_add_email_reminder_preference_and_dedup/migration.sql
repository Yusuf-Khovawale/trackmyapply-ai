-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastReminderEmailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;
