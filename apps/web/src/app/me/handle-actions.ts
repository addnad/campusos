"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateShape, isTaken } from "@/lib/handle";

/// Three months. A handle is how coursemates know someone across every
/// room they are in, so it should not change weekly — but a year is a
/// long time to be stuck with something picked in a first week.
/// Matches how long a released handle is reserved.
const COOLDOWN_MS = 90 * 86400000;

export async function changeHandle(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const wanted = String(formData.get("handle") ?? "").trim();
  const shape = validateShape(wanted);
  if (!shape.ok) return { error: shape.reason };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { handle: true, handleLower: true, handleSetAt: true },
  });
  if (!user) return { error: "No account." };

  const lower = wanted.toLowerCase();
  if (lower === user.handleLower) return { error: "That is already your handle." };

  if (user.handleSetAt && Date.now() - user.handleSetAt.getTime() < COOLDOWN_MS) {
    const next = new Date(user.handleSetAt.getTime() + COOLDOWN_MS);
    return { error: `You can change it again after ${next.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.` };
  }

  if (await isTaken(lower)) return { error: "Someone has that one." };

  try {
    await prisma.$transaction(async (tx) => {
      // The old one is held, not freed: nobody should be able to take the
      // name a student was known by the same afternoon.
      if (user.handleLower) {
        const expiresAt = new Date(Date.now() + 90 * 86400000);
        await tx.handleReservation.upsert({
          where: { handleLower: user.handleLower },
          update: { expiresAt, releasedAt: new Date() },
          create: { handleLower: user.handleLower, formerUserId: session.user.id, expiresAt },
        });
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { handle: wanted, handleLower: lower, handleSetAt: new Date() },
      });
    });
  } catch {
    return { error: "Could not change it. Try again." };
  }

  revalidatePath("/me");
  return { ok: true, handle: wanted };
}
