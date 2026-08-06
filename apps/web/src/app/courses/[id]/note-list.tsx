"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { hideNote } from "./note-actions";

type Card = {
  id: string; title: string; preview: string | null; hasMore: boolean;
  topic: string | null; isShared: boolean; mine: boolean; handle: string | null;
  updatedAt: Date; thumb: string | null; fileName: string | null; isFile: boolean;
};

function when(d: Date) {
  const days = Math.round((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NoteCard({ n, courseId, onHide }: { n: Card; courseId: string; onHide?: () => void }) {
  const [pending, start] = useTransition();

  return (
    <li className="relative">
      <Link href={`/courses/${courseId}/notes/${n.id}`} className="flex gap-3 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]">
        {n.thumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={n.thumb} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : n.isFile ? (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-sunken text-2xl">&#128196;</span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{n.title}</span>
            <span className="shrink-0 label text-muted">{when(n.updatedAt)}</span>
          </span>

          {n.topic && <span className="mt-0.5 block truncate text-sm text-muted">{n.topic}</span>}

          {n.preview && (
            <span className="mt-1 block text-sm leading-snug text-muted">
              {n.preview}{n.hasMore ? "..." : ""}
            </span>
          )}

          {!n.preview && n.isFile && (
            <span className="mt-1 block truncate text-sm text-muted">{n.fileName}</span>
          )}

          {!n.mine && (
            <span className="mt-1 block label text-muted">@{n.handle}</span>
          )}
          {n.mine && n.isShared && (
            <span className="mt-1 inline-block rounded-full bg-sunken px-2 py-0.5 font-mono text-[10px] uppercase text-muted">Shared</span>
          )}
        </span>
      </Link>

      {onHide && (
        <button type="button" disabled={pending} onClick={() => start(async () => { await hideNote(n.id, courseId); onHide(); })} aria-label="Hide this note" className="absolute right-2 top-2 rounded-full px-2 text-lg leading-none text-muted hover:text-ink">
          &times;
        </button>
      )}
    </li>
  );
}

export function NoteList({ notes, courseId }: { notes: { mine: Card[]; shared: Card[] }; courseId: string }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const shared = notes.shared.filter((n) => !hidden.includes(n.id));

  return (
    <>
      <section className="mt-6">
        <h2 className="font-display text-lg uppercase text-ink">Your notes</h2>
        {notes.mine.length === 0 ? (
          <p className="mt-2 text-muted">
            Nothing yet. Write one, or photograph the board — yours stay private
            unless you share them.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.mine.map((n) => <NoteCard key={n.id} n={n} courseId={courseId} />)}
          </ul>
        )}
      </section>

      {shared.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg uppercase text-ink">Shared by coursemates</h2>
          <ul className="mt-3 space-y-2">
            {shared.map((n) => (
              <NoteCard key={n.id} n={n} courseId={courseId} onHide={() => setHidden((h) => [...h, n.id])} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
