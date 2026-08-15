import { config } from "dotenv";
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/// Data for a demo: enough that every screen has something real on it,
/// not so much that it reads as fabricated. Re-runnable — it clears what
/// it made before making it again.

const MAIN = "johnny";
const PEERS = ["bernice", "mamunat_21", "ninth"];

const CLASSES = [
  // Monday
  { code: "COS 101", weekday: 1, startsAt: 8 * 60, endsAt: 10 * 60, venue: "LT 4", lecturer: "Dr. A. Ogunleye" },
  { code: "MTH 101", weekday: 1, startsAt: 12 * 60, endsAt: 13 * 60 + 30, venue: "Maths Block 2", lecturer: "Mr. Bello" },
  // Tuesday
  { code: "PHY 101", weekday: 2, startsAt: 9 * 60, endsAt: 11 * 60, venue: "Physics LT", lecturer: "Prof. Adeyemi" },
  { code: "GST 111", weekday: 2, startsAt: 14 * 60, endsAt: 16 * 60, venue: "Main Auditorium", lecturer: "Mrs. Nwankwo" },
  // Wednesday
  { code: "STA 111", weekday: 3, startsAt: 8 * 60, endsAt: 10 * 60, venue: "LT 1", lecturer: "Dr. Okonkwo" },
  { code: "COS 101", weekday: 3, startsAt: 13 * 60, endsAt: 15 * 60, venue: "ICT Lab", lecturer: "Dr. A. Ogunleye" },
  // Thursday
  { code: "PHY 107", weekday: 4, startsAt: 9 * 60, endsAt: 12 * 60, venue: "Physics Lab", lecturer: "Mr. Salami" },
  { code: "MTH 103", weekday: 4, startsAt: 14 * 60, endsAt: 15 * 60 + 30, venue: "Maths Block 1", lecturer: "Mrs. Eze" },
  // Friday
  { code: "GST 111", weekday: 5, startsAt: 10 * 60, endsAt: 12 * 60, venue: "Main Auditorium", lecturer: "Mrs. Nwankwo" },
  { code: "STA 111", weekday: 5, startsAt: 15 * 60, endsAt: 17 * 60, venue: "LT 1", lecturer: "Dr. Okonkwo" },
];

const DAY = 86400000;

async function main() {
  const user = await prisma.user.findFirst({ where: { handle: MAIN }, select: { id: true } });
  if (!user) throw new Error(`no user @${MAIN}`);

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true, level: true, semester: true },
  });
  if (!profile) throw new Error("no active profile");

  const enrolments = await prisma.enrolment.findMany({
    where: { profileId: profile.id, status: "ACTIVE" },
    select: { courseId: true, course: { select: { displayCode: true } } },
  });
  const byCode = new Map(enrolments.map((e) => [e.course.displayCode, e.courseId]));

  // Start clean so re-running does not stack duplicates.
  await prisma.classSession.deleteMany({ where: { profileId: profile.id } });
  await prisma.assessment.deleteMany({ where: { profileId: profile.id } });

  let classes = 0;
  for (const c of CLASSES) {
    const courseId = byCode.get(c.code);
    if (!courseId) continue;
    await prisma.classSession.create({
      data: { courseId, profileId: profile.id, weekday: c.weekday, startsAt: c.startsAt, endsAt: c.endsAt, venue: c.venue, lecturer: c.lecturer, confidence: "STUDENT_SUPPLIED" },
    });
    classes += 1;
  }

  const now = new Date();
  const at = (days: number, hour: number) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const work = [
    { code: "COS 101", title: "Problem set 3", kind: "ASSIGNMENT" as const, dueAt: at(0, 23) },
    { code: "GST 111", title: "Group presentation slides", kind: "PRESENTATION" as const, dueAt: at(2, 12) },
    { code: "MTH 101", title: "Continuous assessment test", kind: "TEST" as const, dueAt: at(6, 10) },
    { code: "STA 111", title: "Descriptive statistics worksheet", kind: "ASSIGNMENT" as const, dueAt: at(9, 23) },
  ];

  let due = 0;
  for (const w of work) {
    const courseId = byCode.get(w.code);
    if (!courseId) continue;
    await prisma.assessment.create({
      data: { courseId, profileId: profile.id, title: w.title, kind: w.kind, dueAt: w.dueAt, confidence: "STUDENT_SUPPLIED" },
    });
    due += 1;
  }

  console.log(`@${MAIN}: ${classes} class times, ${due} assessments`);

  // Peers get the same timetable, so suggestions have something behind
  // them and rooms have real membership.
  let peers = 0;
  for (const handle of PEERS) {
    const u = await prisma.user.findFirst({ where: { handle }, select: { id: true } });
    if (!u) continue;
    const p = await prisma.studentProfile.findFirst({ where: { userId: u.id, isActive: true }, select: { id: true } });
    if (!p) continue;

    await prisma.classSession.deleteMany({ where: { profileId: p.id } });
    for (const c of CLASSES.slice(0, 3)) {
      const courseId = byCode.get(c.code);
      if (!courseId) continue;
      await prisma.classSession.create({
        data: { courseId, profileId: p.id, weekday: c.weekday, startsAt: c.startsAt, endsAt: c.endsAt, venue: c.venue, lecturer: c.lecturer },
      });
    }
    peers += 1;
  }

  console.log(`${peers} coursemates given the same timetable`);
}

/// A room reads as coursemates or it reads as filler. This is people
/// asking about the work, not about the app.
const TALK: [string, string][] = [
  ["bernice", "has anyone started the problem set?"],
  ["johnny", "started it last night. question 3 is the annoying one"],
  ["mamunat_21", "wait is it due tonight or tomorrow"],
  ["johnny", "tonight. 11:59"],
  ["mamunat_21", "ah. ok thanks"],
  ["ninth", "the lab moved to ICT lab by the way, not LT 4"],
  ["bernice", "since when?"],
  ["ninth", "dr ogunleye said it in class on wednesday"],
  ["johnny", "good to know. was going to walk to the wrong building"],
  ["bernice", "for q3 do we use the recursive form or iterative?"],
  ["johnny", "either. he only marks the output"],
];

async function seedRoom() {
  const room = await prisma.community.findFirst({
    where: { course: { displayCode: "COS 101" }, level: "100 Level", semester: 1 },
    select: { id: true },
  });
  if (!room) { console.log("no COS 101 room — open Rooms in the app once"); return; }

  const profiles = new Map<string, string>();
  for (const [handle] of TALK) {
    if (profiles.has(handle)) continue;
    const u = await prisma.user.findFirst({ where: { handle }, select: { id: true } });
    if (!u) continue;
    const p = await prisma.studentProfile.findFirst({ where: { userId: u.id, isActive: true }, select: { id: true } });
    if (!p) continue;
    profiles.set(handle, p.id);
    await prisma.communityMember.upsert({
      where: { communityId_profileId: { communityId: room.id, profileId: p.id } },
      update: {},
      create: { communityId: room.id, profileId: p.id },
    });
  }

  await prisma.message.deleteMany({ where: { communityId: room.id } });

  // Spread across the last few hours so timestamps read naturally.
  const start = Date.now() - 5 * 3600000;
  let previous: string | null = null;

  for (const [i, [handle, body]] of TALK.entries()) {
    const profileId = profiles.get(handle);
    if (!profileId) continue;
    const m: { id: string } = await prisma.message.create({
      data: {
        communityId: room.id,
        authorId: profileId,
        body,
        createdAt: new Date(start + i * 12 * 60000),
        // one reply, so threading is visible
        replyToId: i === 9 ? previous : null,
      },
    });
    if (i === 8) previous = m.id;
  }

  const all = await prisma.message.findMany({ where: { communityId: room.id }, orderBy: { createdAt: "asc" }, select: { id: true } });
  const reactor = [...profiles.values()][2];
  if (reactor && all[5]) {
    await prisma.reaction.upsert({
      where: { messageId_profileId_emoji: { messageId: all[5].id, profileId: reactor, emoji: "\u{1F64F}" } },
      update: {},
      create: { messageId: all[5].id, profileId: reactor, emoji: "\u{1F64F}" },
    });
  }

  console.log(`COS 101 room: ${TALK.length} messages, ${profiles.size} members`);
}

main().then(seedRoom).finally(() => prisma.$disconnect());
