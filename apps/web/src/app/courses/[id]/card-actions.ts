"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentStatus } from "@/generated/prisma/client";
import { cardAllowanceFor, schedule } from "@/modules/learning/cards";
import { extractNote } from "@/modules/learning/extract";

async function guard(courseId: string) {
  const session = await auth();
  if (!session?.user) return null;
  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return null;
  const enrolled = await prisma.enrolment.findFirst({
    where: { profileId: profile.id, courseId, status: EnrolmentStatus.ACTIVE },
    select: { id: true },
  });
  return enrolled ? { profile, userId: session.user.id } : null;
}

/// Cards come from a note the student already has, so the deck is
/// grounded in their own material rather than invented.
export async function generateCards(noteId: string, courseId: string) {
  const ctx = await guard(courseId);
  if (!ctx) return { error: "You are not taking this course." };

  const allowance = await cardAllowanceFor(ctx.profile.id, ctx.userId);
  if (allowance.madeToday >= allowance.limit) {
    return { error: `That is today\u2019s ${allowance.limit} decks. More tomorrow.` };
  }

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, body: true, extracted: true, filePath: true, isShared: true, profileId: true, courseId: true },
  });
  if (!note || note.courseId !== courseId) return { error: "No such note." };
  if (note.profileId !== ctx.profile.id && !note.isShared) return { error: "Not your note." };
  // A file note has to be read first. Extracted once and stored, so a
  // second deck from the same note costs nothing.
  let source = note.body ?? note.extracted ?? "";
  if (source.trim().length < 100 && note.filePath) {
    const read = await extractNote(note.id);
    if ("error" in read) return { error: read.error };
    source = read.text ?? "";
  }
  if (source.trim().length < 100) {
    return { error: "That note is too short to make cards from." };
  }

  const res = await fetch(`${process.env.TUTOR_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TUTOR_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.TUTOR_MODEL,
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "Turn a student's lecture note into flashcards.",
            "Return ONLY a JSON array, no prose, no code fence.",
            "Each item: {\"front\": \"question\", \"back\": \"answer\"}.",
            "Between 5 and 12 cards. One idea per card.",
            "Fronts are questions a lecturer might ask. Backs are one or two sentences.",
            "Use only what the note contains. Do not add outside material.",
          ].join("\n"),
        },
        { role: "user", content: `${note.title}\n\n${source.slice(0, 6000)}` },
      ],
    }),
  });

  if (!res.ok) return { error: "Could not make cards just now." };

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") return { error: "Nothing came back." };

  let cards: { front: string; back: string }[];
  try {
    // Models wrap JSON in fences despite being told not to.
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    cards = parsed
      .filter((c) => typeof c?.front === "string" && typeof c?.back === "string")
      .slice(0, 12)
      .map((c) => ({ front: String(c.front).slice(0, 300), back: String(c.back).slice(0, 800) }));
  } catch {
    return { error: "The cards came back malformed. Try again." };
  }

  if (cards.length === 0) return { error: "No usable cards came back." };

  await prisma.flashcard.createMany({
    data: cards.map((c) => ({
      courseId, profileId: ctx.profile.id, noteId: note.id,
      front: c.front, back: c.back,
    })),
  });

  revalidatePath(`/courses/${courseId}`);
  return { ok: true, made: cards.length };
}

export async function reviewCard(cardId: string, correct: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return { error: "No profile." };

  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, profileId: profile.id },
    select: { interval: true, streak: true },
  });
  if (!card) return { error: "Not your card." };

  const next = schedule(card.interval, card.streak, correct);
  await prisma.flashcard.update({
    where: { id: cardId },
    data: { ...next, lastSeen: new Date() },
  });
  return { ok: true };
}

export async function deleteCard(cardId: string, courseId: string) {
  const ctx = await guard(courseId);
  if (!ctx) return { error: "Not allowed." };
  await prisma.flashcard.deleteMany({ where: { id: cardId, profileId: ctx.profile.id } });
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}
