import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { JobFinderForm } from "@/components/jobs/job-finder-form";

export default async function JobsPage() {
  const userId = await requireUserId();
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      targetRoles: true,
      targetLocations: true,
      workPreference: true,
      experienceLevel: true,
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Job finder
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Search LinkedIn, Indeed, and Google Jobs — pre-filtered to your
          profile and preferences.
        </p>
      </div>

      <JobFinderForm
        defaultRole={profile?.targetRoles?.split(",")[0]?.trim() ?? ""}
        defaultLocation={profile?.targetLocations?.split(",")[0]?.trim() ?? ""}
        defaultRemote={profile?.workPreference ?? "ANY"}
        defaultLevel={profile?.experienceLevel ?? ""}
      />
    </div>
  );
}
