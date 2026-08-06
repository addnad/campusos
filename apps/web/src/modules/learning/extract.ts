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
    // A PDF has to be sent inline: the signed URL is private and
    // time-limited, so it cannot be fetched from outside.
    const file = await fetch(url);
    if (!file.ok) {
      await prisma.note.update({ where: { id: noteId }, data: { extractFailed: true } });
      return { error: "Could not open that file." };
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) {
      return { error: "That file is too large to read." };
    }
    content = [
      { type: "text", text: "Transcribe the text of this document. Return only the text, no commentary. Keep headings and list structure." },
      {
        type: "file",
        file: {
          filename: "note.pdf",
          file_data: `data:application/pdf;base64,${bytes.toString("base64")}`,
        },
      },
    ];
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
