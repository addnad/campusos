import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { noteFor } from "@/modules/learning/notes";
import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signup");
  if (!session.user.handle) redirect("/handle");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true },
  });
  if (!profile) redirect("/onboarding");

  const { id, noteId } = await params;
  const note = await noteFor(profile.id, noteId);
  if (!note || note.courseId !== id) notFound();

  return (
    <main className="min-h-screen bg-ground px-6 pb-24 pt-8">
      <article className="mx-auto w-full max-w-2xl">
        <Link href={`/courses/${id}?tab=notes`} className="font-mono text-xs uppercase tracking-widest text-muted">
          &larr; {note.course.displayCode} notes
        </Link>

        <h1 className="mt-6 font-display text-3xl leading-tight text-ink">{note.title}</h1>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 font-mono text-[11px] uppercase tracking-widest text-muted">
          <span>{note.mine ? "You" : `@${note.profile.user.handle}`}</span>
          <span>{note.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          {note.topic && <span>{note.topic}</span>}
        </p>

        {note.file && (
          note.file.type?.startsWith("image/") ? (
            <a href={note.file.url} target="_blank" rel="noreferrer" className="mt-6 block overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={note.file.url} alt={note.file.name ?? ""} className="w-full object-contain" />
            </a>
          ) : (
            <a href={note.file.url} target="_blank" rel="noreferrer" download={note.file.name ?? undefined} className="mt-6 flex items-center gap-3 rounded-2xl bg-card p-4">
              <span className="text-2xl">&#128196;</span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-ink">{note.file.name ?? "File"}</span>
                <span className="block font-mono text-[11px] uppercase tracking-widest text-muted">Open</span>
              </span>
            </a>
          )
        )}

        {note.body && (
          <div className="mt-6 whitespace-pre-wrap break-words text-lg leading-relaxed text-ink">
            {note.body}
          </div>
        )}
      </article>

      <BottomNav active="/courses" />
    </main>
  );
}
