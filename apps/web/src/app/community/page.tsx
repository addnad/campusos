import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomsFor, pendingFor, THRESHOLD } from "@/modules/collaboration/queries";
import { BottomNav } from "@/components/layout/bottom-nav";
import { JoinButton } from "./join-button";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) redirect("/onboarding");

  const [rooms, pending] = await Promise.all([
    roomsFor(profile.id),
    pendingFor(profile.id),
  ]);

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink">
          {rooms.length === 0 ? "No rooms yet" : rooms.length === 1 ? "1 room" : `${rooms.length} rooms`}
        </h1>
        <p className="mt-3 text-muted">
          A room opens for a course once {THRESHOLD} of you are here. Everyone
          taking it is in the same room &mdash; no links, no strangers.
        </p>

        {rooms.length > 0 && (
          <ul className="mt-8 space-y-2">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center gap-4 rounded-2xl bg-card p-4">
                <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ background: `var(--color-${r.colour})` }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{r.code}</span>
                  <span className="block truncate text-sm text-muted">{r.title}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {r.members} in &middot; {r.messages} {r.messages === 1 ? "message" : "messages"}
                  </span>
                </span>
                {r.joined ? (
                  <Link href={`/community/${r.id}`} className="shrink-0 rounded-full border-2 border-ink px-5 py-2 text-sm font-bold text-ink">Open</Link>
                ) : (
                  <JoinButton communityId={r.id} />
                )}
              </li>
            ))}
          </ul>
        )}

        {pending.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg uppercase text-ink">Waiting on coursemates</h2>
            <ul className="mt-3 space-y-2">
              {pending.map((p) => (
                <li key={p.code} className="flex items-center gap-3 rounded-2xl bg-sunken px-4 py-3">
                  <span className="font-bold text-ink">{p.code}</span>
                  <span className="ml-auto font-mono text-xs uppercase tracking-widest text-muted">
                    {p.here} of {THRESHOLD}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              Tell someone on your course about CampusOS and their room opens too.
            </p>
          </section>
        )}
      </div>

      <BottomNav active="/community" />
    </main>
  );
}
