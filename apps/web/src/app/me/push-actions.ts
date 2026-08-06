"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: session.user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, failedAt: null },
    create: {
      userId: session.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
  return { ok: true };
}

export async function removeSubscription(endpoint: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  return { ok: true };
}

export async function setPrefs(prefs: {
  classes: boolean; deadlines: boolean; mentions: boolean; roomActivity: boolean;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  await prisma.notificationPrefs.upsert({
    where: { userId: session.user.id },
    update: prefs,
    create: { userId: session.user.id, ...prefs },
  });
  return { ok: true };
}
