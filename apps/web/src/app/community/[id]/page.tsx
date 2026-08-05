import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roomFor } from "@/modules/collaboration/room";
import { MessageList } from "./message-list";

export const dynamic = "force-dynamic";

export default async function Room({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) redirect("/onboarding");

  const { id } = await params;
  const data = await roomFor(profile.id, id);
  if (!data) notFound();

  const { community, member, messages, urlOf } = data;

  return (
    <main className="min-h-screen bg-ground pb-28">
      <header className="sticky top-0 z-10 border-b-2 border-ink/10 bg-ground px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/community" aria-label="Back" className="text-xl leading-none text-muted">&larr;</Link>
          <div className="min-w-0">
            <p className="truncate font-display text-lg uppercase leading-none text-ink">{community.course.displayCode}</p>
            <p className="truncate font-mono text-[11px] uppercase tracking-widest text-muted">
              {community.level} &middot; {community._count.members} {community._count.members === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 py-6">
        <MessageList
          communityId={community.id}
          me={profile.id}
          myHandle={session.user.handle}
          mutedUntil={member.mutedUntil ? member.mutedUntil.toISOString() : null}
          initial={messages.map((m) => ({
            id: m.id,
            body: m.deletedAt ? "" : m.body,
            deleted: Boolean(m.deletedAt),
            isSystem: m.isSystem,
            file: m.filePath && !m.deletedAt
              ? { url: urlOf.get(m.id) ?? null, type: m.fileType, name: m.fileName, size: m.fileSize }
              : null,
            createdAt: m.createdAt.toISOString(),
            authorId: m.authorId,
            handle: m.author.user.handle,
            reactions: m.reactions,
            replyTo: m.replyTo
              ? { id: m.replyTo.id, body: m.replyTo.body, handle: m.replyTo.author.user.handle }
              : null,
          }))}
        />
      </div>

    </main>
  );
}
