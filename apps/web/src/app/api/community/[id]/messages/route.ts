import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/// Messages after a timestamp. Returning to a backgrounded tab fetches
/// the whole gap in one request rather than losing it.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 403 });

  const member = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId: id, profileId: profile.id } },
    select: { state: true },
  });
  if (!member || member.state === "REMOVED") {
    return NextResponse.json({ error: "not a member" }, { status: 403 });
  }

  // Heartbeat on every poll. seenAt is @updatedAt, so it refreshes for
  // free; typingUntil is set a few seconds ahead by the client and
  // lapses on its own.
  const typing = req.nextUrl.searchParams.get("typing") === "1";
  await prisma.presence.upsert({
    where: { communityId_profileId: { communityId: id, profileId: profile.id } },
    update: { typingUntil: typing ? new Date(Date.now() + 4000) : null },
    create: {
      communityId: id,
      profileId: profile.id,
      typingUntil: typing ? new Date(Date.now() + 4000) : null,
    },
  });

  const others = await prisma.presence.findMany({
    where: {
      communityId: id,
      profileId: { not: profile.id },
      seenAt: { gte: new Date(Date.now() - 20000) },
    },
    select: {
      typingUntil: true,
      profile: { select: { user: { select: { handle: true } } } },
    },
  });

  const now = new Date();
  const online = others.map((o) => o.profile.user.handle).filter(Boolean) as string[];
  const typingNow = others
    .filter((o) => o.typingUntil && o.typingUntil > now)
    .map((o) => o.profile.user.handle)
    .filter(Boolean) as string[];

  const since = req.nextUrl.searchParams.get("since");
  const after = since ? new Date(since) : null;

  const messages = await prisma.message.findMany({
    where: {
      communityId: id,
      ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      author: { select: { id: true, user: { select: { handle: true } } } },
      reactions: { select: { emoji: true, profileId: true } },
      replyTo: {
        select: { id: true, body: true, author: { select: { user: { select: { handle: true } } } } },
      },
    },
  });

  // Reactions change on messages that are not new, so the timestamp
  // filter would never carry them. Send the recent set every poll: it is
  // a small payload and it keeps everyone in sync.
  const recent = await prisma.message.findMany({
    where: { communityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, deletedAt: true, reactions: { select: { emoji: true, profileId: true } } },
  });

  return NextResponse.json({
    profileId: profile.id,
    online,
    typing: typingNow,
    reactions: recent.map((m) => ({ id: m.id, reactions: m.reactions })),
    // Deleted messages are soft-deleted, so the timestamp filter never
    // carries their removal. Send what is still visible.
    visible: recent.map((m) => m.id),
    deleted: recent.filter((m) => m.deletedAt).map((m) => m.id),
    messages: messages.map((m) => ({
      id: m.id,
      // A message vanishing silently makes the thread confusing to read,
      // especially where someone replied to it. Leave a marker.
      body: m.deletedAt ? "" : m.body,
      deleted: Boolean(m.deletedAt),
      createdAt: m.createdAt.toISOString(),
      authorId: m.authorId,
      handle: m.author.user.handle,
      reactions: m.reactions,
      replyTo: m.replyTo
        ? { id: m.replyTo.id, body: m.replyTo.body, handle: m.replyTo.author.user.handle }
        : null,
    })),
  });
}
