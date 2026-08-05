"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";

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

  await prisma.communityMember.upsert({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
    update: {},
    create: { communityId, profileId: profile.id },
  });

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
  if (body.length === 0) return { error: "Say something." };
  if (body.length > MAX_LENGTH) return { error: "That is too long." };

  const recent = await prisma.message.count({
    where: { authorId: ctx.profileId, createdAt: { gte: new Date(Date.now() - 60000) } },
  });
  if (recent >= MAX_PER_MINUTE) return { error: "Slow down a moment." };

  const replyToId = String(formData.get("replyToId") ?? "") || null;
  await prisma.message.create({
    data: { communityId, authorId: ctx.profileId, body, replyToId },
  });
  revalidatePath(`/community/${communityId}`);
  return { ok: true };
}

/// Reporting, not automated matching: students know what is abusive in
/// Pidgin, Yoruba, Hausa and Igbo far better than a wordlist does.
export async function reportMessage(communityId: string, messageId: string, reason?: string) {
  const ctx = await membership(communityId);
  if (!ctx) return { error: "You are not in this room." };

  await prisma.report.upsert({
    where: { messageId_reporterId: { messageId, reporterId: ctx.profileId } },
    update: {},
    create: { messageId, reporterId: ctx.profileId, reason: reason ?? null },
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
