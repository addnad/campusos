import { prisma } from "@/lib/prisma";
import { signFor } from "@/modules/collaboration/attachments";

/// Reads text out of an uploaded note. A photo of the board is the most
/// common student note and traditional OCR handles handwriting, angles
/// and glare badly, so this goes through a vision model instead.
export async function extractNote(noteId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, filePath: true, fileType: true, extracted: true, extractFailed: true },
  });
  if (!note?.filePath) return { error: "No file on that note." };
  if (note.extracted) return { ok: true, text: note.extracted };

  const model = process.env.TUTOR_VISION_MODEL;
  const base = process.env.TUTOR_API_BASE;
  const key = process.env.TUTOR_API_KEY;
  if (!model || !base || !key) return { error: "Reading is not configured." };

  const url = await signFor(note.filePath);
  const isImage = note.fileType?.startsWith("image/");

  let content;
  if (isImage) {
    content = [
      { type: "text", text: "Transcribe every word in this image of a student's lecture note. Return only the text, no commentary. Keep headings and list structure. If handwriting is unclear, give your best reading rather than skipping it." },
      { type: "image_url", image_url: { url } },
    ];
  } else {
    // Read it here rather than sending it: the model was receiving a
    // placeholder rather than the document, and a typed PDF has its text
    // already — no call needed, nothing to pay for, and faster.
    const file = await fetch(url);
    if (!file.ok) {
      await prisma.note.update({ where: { id: noteId }, data: { extractFailed: true } });
      return { error: "Could not open that file." };
    }

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });
    const { text } = await parser.getText();
    await parser.destroy();

    const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();
    if (cleaned.length < 40) {
      // A scanned PDF is images in a wrapper and has no text to read.
      await prisma.note.update({ where: { id: noteId }, data: { extractFailed: true } });
      return { error: "That PDF has no readable text — try a photo of the page instead." };
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { extracted: cleaned.slice(0, 20000), extractedAt: new Date(), extractFailed: false },
    });
    return { ok: true, text: cleaned };
  }

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        temperature: 0,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      await prisma.note.update({ where: { id: noteId }, data: { extractFailed: true } });
      return { error: "Could not read that file." };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length < 40) {
      await prisma.note.update({ where: { id: noteId }, data: { extractFailed: true } });
      return { error: "Not enough readable text in that file." };
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { extracted: text.slice(0, 20000), extractedAt: new Date(), extractFailed: false },
    });
    return { ok: true, text };
  } catch {
    return { error: "Could not read that file." };
  }
}
