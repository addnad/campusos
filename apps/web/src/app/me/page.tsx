import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { semesterFor } from "@/modules/academics/queries";
import { BottomNav } from "@/components/layout/bottom-nav";
import { unreadTotal } from "@/modules/collaboration/queries";
import Link from "next/link";
import { modeLabel, type Kind } from "@/modules/identity/awards";
import { isStaff } from "@/modules/moderation/queries";

export default async function Me() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await semesterFor(session.user.id);
  const unread = profile ? await unreadTotal(profile.id) : 0;
  const initials = session.user.handle.slice(0, 2).toUpperCase();
  const staff = await isStaff(session.user.id);

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-xl text-ground">{initials}</span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl lowercase text-ink">@{session.user.handle}</h1>
            <p className="truncate text-sm text-muted">{session.user.email}</p>
          </div>
        </div>

        {profile && (
          <dl className="mt-10 space-y-4">
            <div>
              <dt className="label text-muted">School</dt>
              <dd className="mt-1 font-bold text-ink">
                {profile.programme.institution.name}
                {profile.programme.campus.name !== "Main Campus" ? ` \u00b7 ${profile.programme.campus.name}` : ""}
              </dd>
            </div>
            <div>
              <dt className="label text-muted">Programme</dt>
              <dd className="mt-1 font-bold text-ink">{profile.level} {profile.programme.name}</dd>
            </div>
            <div>
              <dt className="label text-muted">Attending</dt>
              <dd className="mt-1 font-bold text-ink">
                {modeLabel(profile.programme.institution.kind as Kind, profile.programme.studyMode)}
                {" \u00b7 "}
                {profile.semester === 1 ? "First" : "Second"} semester
              </dd>
            </div>
          </dl>
        )}

        {staff && (
          <Link href="/moderation" className="mt-10 inline-flex rounded-full border-2 border-alarm px-6 py-3 font-bold text-alarm">
            Review reports
          </Link>
        )}

        <form
          className="mt-12"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="rounded-full border-2 border-ink/20 px-6 py-3 font-bold text-ink hover:border-ink">Sign out</button>
        </form>
      </div>
      <BottomNav active="/me" unread={unread} />
    </main>
  );
}
