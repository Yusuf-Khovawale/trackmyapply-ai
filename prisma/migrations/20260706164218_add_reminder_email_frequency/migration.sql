-- CreateEnum
CREATE TYPE "ReminderEmailFrequency" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastDigestEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderEmailFrequency" "ReminderEmailFrequency" NOT NULL DEFAULT 'IMMEDIATE';
