"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";
import { parseHandles } from "@/modules/collaboration/mentions";
import { notify } from "@/modules/notifications/push";

/// Enrolment is what earns a place in a room. Not a link, not an invite:
/// a room is defined by who is taking the course.
export async function joinRoom(communityId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return { error: "No profile." };

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { courseId: true, level: true, semester: true },
  });
  if (!community) return { error: "No such room." };

  const enrolled = await prisma.enrolment.findFirst({
    where: {
      profileId: profile.id,
      courseId: community.courseId,
      level: community.level,
      semester: community.semester,
      status: EnrolmentStatus.ACTIVE,
    },
    select: { id: true },
  });
  if (!enrolled) return { error: "You are not taking this course." };

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
    select: { state: true },
  });
  // Removal is not undone by rejoining.
  if (existing?.state === "REMOVED") return { error: "You cannot rejoin this room." };

  const created = await prisma.communityMember.upsert({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
    update: {},
    create: { communityId, profileId: profile.id },
    select: { joinedAt: true },
  });

  // Only on a first join, not on a rejoin after a timeout.
  if (!existing) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true },
    });
    await prisma.message.create({
      data: {
        communityId,
        authorId: profile.id,
        body: `@${user?.handle ?? "someone"} joined`,
        isSystem: true,
      },
    });
  }

  revalidatePath("/community");
  return { ok: true };
}

/// 2000 was short for how students actually write — one normal update
/// about a day ran past it.
const MAX_LENGTH = 5000;
/// Most early trouble is volume, not vocabulary.
const MAX_PER_MINUTE = 10;

async function membership(communityId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return null;
  const member = await prisma.communityMember.findUnique({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
  });
  if (!member || member.state === "REMOVED") return null;
  return { profileId: profile.id, member };
}

export async function postMessage(communityId: string, formData: FormData) {
  const ctx = await membership(communityId);
  if (!ctx) return { error: "You are not in this room." };

  if (ctx.member.state === "TIMED_OUT" && ctx.member.mutedUntil && ctx.member.mutedUntil > new Date()) {
    return { error: "You are timed out in this room." };
  }

  const body = String(formData.get("body") ?? "").trim();
  const filePath = String(formData.get("filePath") ?? "") || null;
  // A message can be a file with no words.
  if (body.length === 0 && !filePath) return { error: "Say something." };
  if (body.length > MAX_LENGTH) return { error: "That is too long." };

  const recent = await prisma.message.count({
    where: { authorId: ctx.profileId, createdAt: { gte: new Date(Date.now() - 60000) } },
  });
  if (recent >= MAX_PER_MINUTE) return { error: "Slow down a moment." };

  const replyToId = String(formData.get("replyToId") ?? "") || null;
  const handles = parseHandles(body);

  const created = await prisma.message.create({
    data: {
      communityId,
      authorId: ctx.profileId,
      body,
      replyToId,
      filePath,
      fileType: filePath ? String(formData.get("fileType") ?? "") || null : null,
      fileSize: filePath ? Number(formData.get("fileSize")) || null : null,
      fileName: filePath ? String(formData.get("fileName") ?? "") || null : null,
    },
    select: { id: true },
  });

  // Resolved against members only: naming someone who is not in the room
  // is just text, and there is nobody to reach.
  if (handles.length > 0) {
    const named = await prisma.communityMember.findMany({
      where: {
        communityId,
        state: { not: "REMOVED" },
        profile: { user: { handleLower: { in: handles } } },
      },
      select: { profileId: true },
    });
    const others = named.filter((n) => n.profileId !== ctx.profileId);
    if (others.length > 0) {
      await prisma.mention.createMany({
        data: others.map((n) => ({ messageId: created.id, profileId: n.profileId })),
        skipDuplicates: true,
      });

      // Being named is the one room event worth interrupting someone for.
      const [room, me] = await Promise.all([
        prisma.community.findUnique({
          where: { id: communityId },
          select: { course: { select: { displayCode: true } } },
        }),
        prisma.studentProfile.findUnique({ where: { id: ctx.profileId }, select: { user: { select: { handle: true } } } }),
      ]);

      const profiles = await prisma.studentProfile.findMany({
        where: { id: { in: others.map((o) => o.profileId) } },
        select: { userId: true },
      });

      await Promise.all(
        profiles.map((p) =>
          notify(p.userId, "mentions", {
            title: `@${me?.user.handle ?? "someone"} in ${room?.course.displayCode ?? "a room"}`,
            body: body.slice(0, 120),
            url: `/community/${communityId}`,
            tag: `room-${communityId}`,
          }),
        ),
      );
    }
  }
  revalidatePath(`/community/${communityId}`);
  return { ok: true };
}

/// Reporting, not automated matching: students know what is abusive in
/// Pidgin, Yoruba, Hausa and Igbo far better than a wordlist does.
export async function reportMessage(communityId: string, messageId: string, reason: string, note?: string) {
  const ctx = await membership(communityId);
  if (!ctx) return { error: "You are not in this room." };

  await prisma.report.upsert({
    where: { messageId_reporterId: { messageId, reporterId: ctx.profileId } },
    update: {},
    create: { messageId, reporterId: ctx.profileId, reason, note: note?.trim() || null },
  });
  revalidatePath(`/community/${communityId}`);
  return { ok: true };
}

/// Your own message only. Soft delete: a hard one would orphan reports
/// made against it.
export async function deleteOwnMessage(communityId: string, messageId: string) {
  const ctx = await membership(communityId);
  if (!ctx) return { error: "You are not in this room." };

  await prisma.message.updateMany({
    where: { id: messageId, authorId: ctx.profileId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(`/community/${communityId}`);
  return { ok: true };
}

/// A tap toggles: the unique constraint means the same emoji from the
/// same student is one row or none.
export async function toggleReaction(communityId: string, messageId: string, emoji: string) {
  const ctx = await membership(communityId);
  if (!ctx) return { error: "You are not in this room." };

  const existing = await prisma.reaction.findUnique({
    where: { messageId_profileId_emoji: { messageId, profileId: ctx.profileId, emoji } },
    select: { id: true },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { messageId, profileId: ctx.profileId, emoji } });
  }

  revalidatePath(`/community/${communityId}`);
  return { ok: true };
}
