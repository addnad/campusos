"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/modules/moderation/queries";

/// Warning, timeout, removal — per room, because that is where the
/// behaviour was. A pattern across rooms is a separate signal.
const TIMEOUT_HOURS = 24;
const REMOVAL_AT = 3;
/// Three permanent removals in different rooms flags the account for a
/// person to look at. Nothing automatic bans anyone from the product.
const FLAG_AT = 3;

async function staffGuard() {
  const session = await auth();
  if (!session?.user) return null;
  return (await isStaff(session.user.id)) ? session.user.id : null;
}

/// Upholding acts on the message and the member. Every report on that
/// message resolves together: three people reporting one thing is one
/// offence, not three.
export async function upholdReport(messageId: string, deleteMessage: boolean) {
  if (!(await staffGuard())) return { error: "Not allowed." };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { authorId: true, communityId: true },
  });
  if (!message) return { error: "No such message." };

  const result = await prisma.$transaction(async (tx) => {
    await tx.report.updateMany({ where: { messageId }, data: { state: "UPHELD" } });

    if (deleteMessage) {
      await tx.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
    }

    const member = await tx.communityMember.findUnique({
      where: { communityId_profileId: { communityId: message.communityId, profileId: message.authorId } },
      select: { strikes: true },
    });
    const strikes = (member?.strikes ?? 0) + 1;

    const state = strikes >= REMOVAL_AT ? "REMOVED" : strikes === 2 ? "TIMED_OUT" : "ACTIVE";
    const mutedUntil = strikes === 2 ? new Date(Date.now() + TIMEOUT_HOURS * 3600000) : null;

    await tx.communityMember.update({
      where: { communityId_profileId: { communityId: message.communityId, profileId: message.authorId } },
      data: { strikes, state, mutedUntil },
    });

    // A pattern across rooms, not a bad afternoon in one.
    const removals = await tx.communityMember.count({
      where: { profileId: message.authorId, state: "REMOVED" },
    });

    let flagged = false;
    if (removals >= FLAG_AT) {
      const profile = await tx.studentProfile.findUnique({
        where: { id: message.authorId },
        select: { userId: true },
      });
      if (profile) {
        await tx.user.update({ where: { id: profile.userId }, data: { flaggedAt: new Date() } });
        flagged = true;
      }
    }

    return { strikes, state, flagged };
  });

  revalidatePath("/moderation");
  revalidatePath(`/community/${message.communityId}`);
  return { ok: true, ...result };
}

export async function dismissReport(messageId: string) {
  if (!(await staffGuard())) return { error: "Not allowed." };

  await prisma.report.updateMany({ where: { messageId }, data: { state: "DISMISSED" } });
  revalidatePath("/moderation");
  return { ok: true };
}

/// Lifts a timeout or a removal. Strikes stay: the history is the point.
export async function restoreMember(communityId: string, profileId: string) {
  if (!(await staffGuard())) return { error: "Not allowed." };

  await prisma.communityMember.update({
    where: { communityId_profileId: { communityId, profileId } },
    data: { state: "ACTIVE", mutedUntil: null },
  });
  revalidatePath("/moderation");
  return { ok: true };
}
