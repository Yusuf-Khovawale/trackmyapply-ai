-- AlterTable
ALTER TABLE "Application" ADD COLUMN "coverLetter" TEXT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "structured" JSONB,
ADD COLUMN "matchScore" INTEGER,
ADD COLUMN "baseScore" INTEGER,
ADD COLUMN "atsReport" JSONB;

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "summary" TEXT,
    "skills" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "projects" TEXT,
    "certifications" TEXT,
    "targetRoles" TEXT,
    "targetLocations" TEXT,
    "workPreference" TEXT,
    "experienceLevel" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
