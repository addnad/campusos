import { prisma } from "@/lib/prisma";

/// Names that could be used to impersonate the platform inside a community.
const RESERVED = new Set([
  "admin", "administrator", "campusos", "campus", "support", "help",
  "moderator", "mod", "staff", "team", "official", "system", "root",
  "security", "info", "contact", "about", "settings", "profile", "me",
  "login", "logout", "signup", "signin", "auth", "api", "today", "handle",
]);

const SHAPE = /^[a-z0-9_]{3,20}$/;

export type HandleCheck = { ok: true } | { ok: false; reason: string };

export function validateShape(raw: string): HandleCheck {
  const h = raw.trim().toLowerCase();
  if (h.length < 3) return { ok: false, reason: "At least 3 characters." };
  if (h.length > 20) return { ok: false, reason: "20 characters maximum." };
  if (!SHAPE.test(h))
    return { ok: false, reason: "Letters, numbers and underscores only." };
  if (RESERVED.has(h)) return { ok: false, reason: "That one is reserved." };
  return { ok: true };
}

/// Taken if a user holds it, or if it is inside its 3-month reservation.
export async function isTaken(handleLower: string): Promise<boolean> {
  const [user, reserved] = await Promise.all([
    prisma.user.findUnique({ where: { handleLower }, select: { id: true } }),
    prisma.handleReservation.findUnique({
      where: { handleLower },
      select: { expiresAt: true },
    }),
  ]);
  if (user) return true;
  if (reserved && reserved.expiresAt > new Date()) return true;
  return false;
}

/// First-name based, never the full real name: this is public in a room
/// of strangers.
export async function suggest(name: string | null | undefined) {
  const first = (name ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const base = first.replace(/[^a-z0-9]/g, "").slice(0, 12);
  if (base.length < 3) return [];

  const candidates = [
    base,
    `${base}_${Math.floor(Math.random() * 90 + 10)}`,
    `${base}${Math.floor(Math.random() * 900 + 100)}`,
    `${base}_ng`,
    `the${base}`,
  ];

  const free: string[] = [];
  for (const c of candidates) {
    if (free.length === 3) break;
    if (validateShape(c).ok && !(await isTaken(c))) free.push(c);
  }
  return free;
}
