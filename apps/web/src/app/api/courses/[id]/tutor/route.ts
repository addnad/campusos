import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { allowanceFor, contextFor, systemPromptFor, today } from "@/modules/learning/tutor";

export const maxDuration = 60;

/// Streams rather than waiting: the provider is far away, and several
/// seconds of nothing reads as broken.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorised", { status: 401 });

  const { id: courseId } = await params;
  const { question } = await req.json();
  if (typeof question !== "string" || question.trim().length < 3) {
    return new Response("Ask something.", { status: 400 });
  }

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) return new Response("no profile", { status: 403 });

  const allowance = await allowanceFor(profile.id, session.user.id);
  if (allowance.left <= 0) {
    return new Response(`That is today\u2019s ${allowance.limit}. More tomorrow.`, { status: 429 });
  }

  const ctx = await contextFor(profile.id, courseId);
  if (!ctx) return new Response("not enrolled", { status: 403 });

  const thread = await prisma.tutorThread.findFirst({
    where: { profileId: profile.id, courseId },
    orderBy: { updatedAt: "desc" },
    include: { turns: { orderBy: { createdAt: "desc" }, take: 4 } },
  });

  const history = (thread?.turns ?? []).reverse();
  const messages = [
    { role: "system", content: systemPromptFor(ctx) },
    ...history.flatMap((t) => [
      { role: "user", content: t.question },
      { role: "assistant", content: t.answer },
    ]),
    { role: "user", content: question.trim() },
  ];

  const upstream = await fetch(`${process.env.TUTOR_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TUTOR_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.TUTOR_MODEL,
      messages,
      max_tokens: 900,
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("The tutor could not answer just now.", { status: 502 });
  }

  let full = "";
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const token = JSON.parse(payload)?.choices?.[0]?.delta?.content;
              if (typeof token === "string" && token.length > 0) {
                full += token;
                controller.enqueue(new TextEncoder().encode(token));
              }
            } catch {
              // A partial frame; the next chunk completes it.
            }
          }
        }
      } finally {
        controller.close();

        // Saved and counted only once an answer exists: a dropped stream
        // should not cost a student one of their five.
        if (full.trim().length > 0) {
          await prisma.$transaction(async (tx) => {
            const t = thread ?? await tx.tutorThread.create({
              data: { profileId: profile.id, courseId, title: question.slice(0, 60) },
              include: { turns: true },
            });
            await tx.tutorTurn.create({
              data: { threadId: t.id, question: question.trim(), answer: full },
            });
            await tx.tutorThread.update({ where: { id: t.id }, data: { updatedAt: new Date() } });
            await tx.tutorUsage.upsert({
              where: { profileId_day: { profileId: profile.id, day: today() } },
              update: { count: { increment: 1 } },
              create: { profileId: profile.id, day: today(), count: 1 },
            });
          });
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
