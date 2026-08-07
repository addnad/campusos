"use server";

import { signOut } from "@/auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

/// Deletes the account. Cascades handle almost everything — profiles,
/// enrolments, notes, cards, subscriptions all fall with the user — but
/// three things need deciding rather than cascading.
export async function deleteAccount(confirmation: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { handle: true, handleLower: true },
  });
  if (!user) return { error: "No account." };

  // Typed, not tapped: this cannot be undone.
  if (confirmation.trim().toLowerCase() !== (user.handleLower ?? "")) {
    return { error: "That is not your handle." };
  }

  // Files are not rows and do not cascade. Collected before the account
  // goes, or they are orphaned in the store forever.
  const [notes, messages] = await Promise.all([
    prisma.note.findMany({
      where: { profile: { userId: session.user.id }, filePath: { not: null } },
      select: { filePath: true },
    }),
    prisma.message.findMany({
      where: { author: { userId: session.user.id }, filePath: { not: null } },
      select: { filePath: true },
    }),
  ]);

  const paths = [...notes, ...messages].map((r) => r.filePath!).filter(Boolean);

  await prisma.$transaction(async (tx) => {
    // The handle is held rather than freed: released immediately, someone
    // could take the name a student was known by the same afternoon.
    const lower = user.handleLower ?? user.handle?.toLowerCase();
    if (lower) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      await tx.handleReservation.upsert({
        where: { handleLower: lower },
        update: { expiresAt, releasedAt: new Date() },
        create: { handleLower: lower, formerUserId: session.user.id, expiresAt },
      });
    }

    // Messages stay, authorless. A conversation with half of it removed
    // is not a conversation, and coursemates relied on what was said.
    await tx.message.updateMany({
      where: { author: { userId: session.user.id } },
      data: { filePath: null, fileType: null, fileName: null, fileSize: null },
    });

    await tx.user.delete({ where: { id: session.user.id } });
  });

  // Best effort: a file left behind is a tidiness problem, not a
  // correctness one, and the account is already gone.
  await Promise.all(paths.map((p) => del(p).catch(() => undefined)));

  return { ok: true };
}

export async function signOutAfterDelete() {
  await signOut({ redirectTo: "/" });
}
