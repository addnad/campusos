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

  const since = req.nextUrl.searchParams.get("since");
  const after = since ? new Date(since) : null;

  const messages = await prisma.message.findMany({
    where: {
      communityId: id,
      deletedAt: null,
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
    where: { communityId: id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, reactions: { select: { emoji: true, profileId: true } } },
  });

  return NextResponse.json({
    profileId: profile.id,
    reactions: recent.map((m) => ({ id: m.id, reactions: m.reactions })),
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
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
