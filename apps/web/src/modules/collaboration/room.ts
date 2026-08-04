import { prisma } from "@/lib/prisma";

export async function roomFor(profileId: string, communityId: string) {
  const member = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId } },
    select: { state: true, mutedUntil: true },
  });
  if (!member || member.state === "REMOVED") return null;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      course: { select: { displayCode: true, title: true } },
      _count: { select: { members: true } },
    },
  });
  if (!community) return null;

  const messages = await prisma.message.findMany({
    where: { communityId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      author: { select: { id: true, user: { select: { handle: true } } } },
      reports: { where: { reporterId: profileId }, select: { id: true } },
      reactions: { select: { emoji: true, profileId: true } },
      replyTo: {
        select: {
          id: true, body: true, deletedAt: true,
          author: { select: { user: { select: { handle: true } } } },
        },
      },
    },
  });

  return { community, member, messages };
}
