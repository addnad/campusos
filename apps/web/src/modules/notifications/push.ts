import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type Notice = {
  title: string;
  body: string;
  /// Where tapping it should land. Always somewhere real: a notification
  /// that opens the home screen wastes the tap.
  url: string;
  /// Collapses repeats — a second message in the same room replaces the
  /// first rather than stacking.
  tag?: string;
};

export type Kind = "classes" | "deadlines" | "mentions" | "roomActivity";

/// Sends to every device a student has allowed, if they asked for this
/// kind. Notifications people did not ask for are how an app gets
/// uninstalled.
export async function notify(userId: string, kind: Kind, notice: Notice) {
  if (!configure()) return { skipped: "not configured" };

  const prefs = await prisma.notificationPrefs.findUnique({ where: { userId } });
  // No row means defaults, which allow everything except room activity.
  const allowed = prefs ? prefs[kind] : kind !== "roomActivity";
  if (!allowed) return { skipped: "not wanted" };

  const subs = await prisma.pushSubscription.findMany({
    where: { userId, failedAt: null },
  });
  if (subs.length === 0) return { skipped: "no devices" };

  const payload = JSON.stringify(notice);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404 and 410 mean the device is gone for good; anything else
        // might be temporary, so it keeps its place.
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.update({
            where: { id: s.id },
            data: { failedAt: new Date() },
          });
        }
      }
    }),
  );

  return { sent: subs.length };
}
