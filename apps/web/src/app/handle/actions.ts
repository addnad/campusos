"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateShape, isTaken } from "@/lib/handle";

export async function claimHandle(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const raw = String(formData.get("handle") ?? "");
  const shape = validateShape(raw);
  if (!shape.ok) return { error: shape.reason };

  const handleLower = raw.trim().toLowerCase();
  if (await isTaken(handleLower)) return { error: "Already taken." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { handle: raw.trim(), handleLower, handleSetAt: new Date() },
    });
  } catch {
    // Unique constraint: someone claimed it between the check and the write.
    return { error: "Just taken. Try another." };
  }

  redirect("/today");
}
