import { put, presignUrl, issueSignedToken } from "@vercel/blob";

/// Images and PDFs only. A photo of the whiteboard, a scanned
/// assignment, a slide deck — everything else is refused rather than
/// allowing arbitrary files into a room of strangers.
export const ALLOWED = [
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/gif",
  "application/pdf",
];

/// Generous for a phone photo, small enough that nobody uploads a video.
export const MAX_BYTES = 10 * 1024 * 1024;

/// Long enough to open and read, short enough that a leaked link dies.
const URL_TTL_MS = 60 * 60 * 1000;

export function checkFile(type: string, size: number) {
  if (!ALLOWED.includes(type)) return "Images and PDFs only.";
  if (size > MAX_BYTES) return "That file is over 10MB.";
  return null;
}

/// Stored under the room, with a random suffix so two students
/// uploading "note.jpg" do not collide.
export async function storeFile(communityId: string, file: File) {
  const suffix = Math.random().toString(36).slice(2, 10);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const pathname = `rooms/${communityId}/${Date.now()}-${suffix}-${safe}`;

  const blob = await put(pathname, file, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return { pathname: blob.pathname, size: file.size, type: file.type, name: file.name };
}

/// The store is private, so a link is minted per request and only for
/// members. Nothing is reachable by URL alone.
export async function signFor(pathname: string) {
  const validUntil = Date.now() + URL_TTL_MS;

  // Scoped to this one pathname and to reads: a leaked token cannot
  // reach another student's upload or write anything.
  const token = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil,
  });

  const { presignedUrl } = await presignUrl(token, {
    operation: "get",
    access: "private",
    pathname,
    validUntil,
  });
  return presignedUrl;
}
