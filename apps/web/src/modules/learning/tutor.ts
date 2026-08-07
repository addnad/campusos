import { prisma } from "@/lib/prisma";

const FREE_DAILY = 3;

/// The student's own day, not UTC: "five a day" should end at their
/// midnight.
export function today() {
  return new Date().toLocaleDateString("en-CA");
}

export async function allowanceFor(profileId: string, userId: string) {
  const [user, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { tutorDailyLimit: true, tutorPaidUntil: true },
    }),
    prisma.tutorUsage.findUnique({
      where: { profileId_day: { profileId, day: today() } },
      select: { count: true },
    }),
  ]);

  const paid = Boolean(user?.tutorPaidUntil && user.tutorPaidUntil > new Date());
  const limit = paid ? (user?.tutorDailyLimit ?? FREE_DAILY) : FREE_DAILY;
  const used = usage?.count ?? 0;

  return { used, limit, left: Math.max(0, limit - used), paid };
}

/// What the tutor is allowed to read: the course, what the student is
/// carrying, their own notes, and what coursemates shared. It reads
/// academic context and owns none of it (ADR-003).
export async function contextFor(profileId: string, courseId: string) {
  const enrolment = await prisma.enrolment.findFirst({
    where: { profileId, courseId, status: "ACTIVE" },
    include: {
      course: { select: { displayCode: true, title: true } },
      profile: {
        select: {
          level: true, semester: true,
          programme: { select: { name: true, award: true, institution: { select: { name: true } } } },
        },
      },
    },
  });
  if (!enrolment) return null;

  const notes = await prisma.note.findMany({
    where: { courseId, OR: [{ profileId }, { isShared: true }] },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { title: true, topic: true, body: true },
  });

  const assessments = await prisma.assessment.findMany({
    where: { courseId, profileId, dueAt: { gte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: 5,
    select: { title: true, kind: true, dueAt: true },
  });

  return { enrolment, notes, assessments };
}

type Ctx = NonNullable<Awaited<ReturnType<typeof contextFor>>>;

/// Explains and asks back rather than writing essays. Cheaper per answer
/// and better teaching: a student who is walked to the answer remembers
/// it, and a wall of text is skimmed.
export function systemPromptFor(ctx: Ctx) {
  const { enrolment, notes, assessments } = ctx;
  const p = enrolment.profile;

  const lines = [
    "You are a tutor inside CampusOS, helping one student with one course.",
    "",
    `Student: ${p.level} ${p.programme.name} (${p.programme.award}) at ${p.programme.institution.name}, semester ${p.semester}.`,
    `Course: ${enrolment.course.displayCode} — ${enrolment.course.title}, ${enrolment.units} units.`,
    "",
    "How to answer:",
    "- Be brief. Two or three short paragraphs at most unless asked for more.",
    "- Explain the idea, then check understanding with one question back.",
    "- Use the student's own notes where they are relevant, and say which note you drew on.",
    "- If their notes do not cover it, say so plainly and answer from general knowledge, marked as such.",
    "- Never invent a course requirement, a deadline, a mark scheme or a lecturer's opinion. You do not know their syllabus.",
    "- Nigerian tertiary context. Plain English, no padding, no American spellings.",
  ];

  if (notes.length > 0) {
    lines.push("", "The student's notes for this course:");
    for (const n of notes) {
      const body = (n.body ?? "").replace(/\s+/g, " ").slice(0, 1200);
      lines.push(`- ${n.title}${n.topic ? ` (${n.topic})` : ""}: ${body || "[file only, no text]"}`);
    }
  } else {
    lines.push("", "The student has no notes for this course yet.");
  }

  if (assessments.length > 0) {
    lines.push("", "Coming up for them:");
    for (const a of assessments) {
      lines.push(`- ${a.title} (${a.kind.toLowerCase()}), due ${a.dueAt.toDateString()}`);
    }
  }

  return lines.join("\n");
}

export async function askTutor(ctx: Ctx, history: { question: string; answer: string }[], question: string) {
  const base = process.env.TUTOR_API_BASE;
  const key = process.env.TUTOR_API_KEY;
  const model = process.env.TUTOR_MODEL;
  if (!base || !key || !model) return { error: "The tutor is not configured." };

  // Recent turns only: the whole thread would grow the cost of every
  // question without improving the answer.
  const recent = history.slice(-4);
  const messages = [
    { role: "system", content: systemPromptFor(ctx) },
    ...recent.flatMap((t) => [
      { role: "user", content: t.question },
      { role: "assistant", content: t.answer },
    ]),
    { role: "user", content: question },
  ];

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 700, temperature: 0.3 }),
    });

    if (!res.ok) {
      return { error: "The tutor could not answer just now. Try again." };
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || answer.length === 0) {
      return { error: "The tutor returned nothing. Try again." };
    }

    return { answer };
  } catch {
    return { error: "Could not reach the tutor. Check your connection." };
  }
}
