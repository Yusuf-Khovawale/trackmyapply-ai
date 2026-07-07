import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { saveProfile } from "./actions";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const userId = await requireUserId();
  const profile = await prisma.profile.findUnique({ where: { userId } });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 sm:py-12">
      {welcome ? (
        <div className="glass-card border-indigo-400/30 p-6">
          <p className="text-sm font-semibold text-indigo-200">
            Welcome to GetHired AI 👋
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Tell your AI mentor about yourself once — it powers everything:
            resume building, 90%+ JD tailoring, cover letters, interview
            prep, and job matching.
          </p>
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Your profile
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          The single source of truth your AI mentor works from.
        </p>
      </div>

      <ProfileForm action={saveProfile} defaults={profile} />
    </div>
  );
}
