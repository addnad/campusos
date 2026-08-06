import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/modules/notifications/push";
import { EnrolmentStatus } from "@/generated/prisma/client";

export const maxDuration = 60;

/// Runs every 15 minutes. Sends a reminder for a class starting in the
/// next window, and for anything due today — once, not on every run.
export async function GET(req: NextRequest) {
  // Vercel signs its cron calls; anything else is refused.
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorised", { status: 401 });
  }

  const now = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  // A class starting in the next 15-45 minutes: enough warning to walk
  // there, not so much that it is forgotten again by the time it starts.
  const from = minutes + 15;
  const to = minutes + 45;

  const sessions = await prisma.classSession.findMany({
    where: { weekday, startsAt: { gte: from, lt: to } },
    include: {
      course: { select: { displayCode: true, id: true } },
      profile: { select: { userId: true } },
    },
  });

  for (const s of sessions) {
    const mins = s.startsAt - minutes;
    await notify(s.profile.userId, "classes", {
      title: `${s.course.displayCode} in ${mins} min`,
      body: [s.venue, s.lecturer].filter(Boolean).join(" \u00b7 ") || "Class starting soon",
      url: `/courses/${s.course.id}`,
      tag: `class-${s.id}`,
    });
  }

  // Deadlines: one nudge in the morning for anything due today.
  let deadlines = 0;
  if (now.getHours() === 7 && now.getMinutes() < 15) {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const due = await prisma.assessment.findMany({
      where: { dueAt: { gte: now, lte: endOfDay } },
      include: {
        course: { select: { displayCode: true, id: true } },
        profile: { select: { userId: true } },
      },
    });

    for (const a of due) {
      await notify(a.profile.userId, "deadlines", {
        title: `${a.course.displayCode} due today`,
        body: a.title,
        url: `/courses/${a.course.id}`,
        tag: `due-${a.id}`,
      });
      deadlines += 1;
    }
  }

  return NextResponse.json({ classes: sessions.length, deadlines });
}
