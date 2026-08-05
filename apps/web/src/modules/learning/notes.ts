import { prisma } from "@/lib/prisma";
import { signFor } from "@/modules/collaboration/attachments";

/// Split rather than merged: your own notes are study material you are
/// maintaining, a coursemate's is a resource you are browsing. They read
/// differently and belong in different lists.
export async function notesFor(profileId: string, courseId: string) {
  const [mine, shared, hidden] = await Promise.all([
    prisma.note.findMany({
      where: { courseId, profileId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.note.findMany({
      where: { courseId, isShared: true, profileId: { not: profileId } },
      orderBy: { updatedAt: "desc" },
      include: { profile: { select: { user: { select: { handle: true } } } } },
    }),
    prisma.hiddenNote.findMany({ where: { profileId }, select: { noteId: true } }),
  ]);

  const hiddenIds = new Set(hidden.map((h) => h.noteId));

  const shape = async (n: {
    id: string; title: string; body: string | null; topic: string | null;
    isShared: boolean; updatedAt: Date; filePath: string | null;
    fileType: string | null; fileName: string | null;
  }, handle: string | null, mineFlag: boolean) => ({
    id: n.id,
    title: n.title,
    // A preview, so a student does not have to open a note to find out
    // what it is.
    preview: n.body ? n.body.replace(/\s+/g, " ").slice(0, 140) : null,
    hasMore: Boolean(n.body && n.body.length > 140),
    topic: n.topic,
    isShared: n.isShared,
    mine: mineFlag,
    handle,
    updatedAt: n.updatedAt,
    thumb: n.filePath && n.fileType?.startsWith("image/") ? await signFor(n.filePath) : null,
    fileName: n.fileName,
    isFile: Boolean(n.filePath),
  });

  return {
    mine: await Promise.all(mine.map((n) => shape(n, null, true))),
    shared: await Promise.all(
      shared.filter((n) => !hiddenIds.has(n.id)).map((n) => shape(n, n.profile.user.handle, false)),
    ),
  };
}

export async function noteFor(profileId: string, noteId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      profile: { select: { user: { select: { handle: true } } } },
      course: { select: { id: true, displayCode: true, title: true } },
    },
  });
  // A private note belongs to one person; a shared one to the course.
  if (!note) return null;
  if (note.profileId !== profileId && !note.isShared) return null;

  return {
    ...note,
    mine: note.profileId === profileId,
    file: note.filePath
      ? { url: await signFor(note.filePath), type: note.fileType, name: note.fileName, size: note.fileSize }
      : null,
  };
}
