"use client";

import { useState, useTransition } from "react";
import { generateCards } from "./card-actions";
import { CardReview } from "./card-review";

type Card = { id: string; front: string; back: string };
type NoteOption = { id: string; title: string };

export function CardsPanel({ courseId, code, due, total, notes, decksLeft }: {
  courseId: string; code: string; due: Card[]; total: number;
  notes: NoteOption[]; decksLeft: number;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<number | null>(null);
  const [pending, start] = useTransition();

  if (reviewing && !finished) {
    return <CardReview cards={due} onDone={() => setFinished(true)} />;
  }

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg uppercase text-ink">Cards</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {total} in {code}
        </span>
      </div>

      {finished && (
        <p className="mt-4 rounded-2xl bg-sunken px-5 py-4 text-ink">
          Done for now. The ones you missed come back tomorrow.
        </p>
      )}

      {!finished && due.length > 0 && (
        <button type="button" onClick={() => setReviewing(true)} className="mt-4 w-full rounded-full bg-ink px-6 py-4 font-bold text-ground">
          Review {due.length} {due.length === 1 ? "card" : "cards"}
        </button>
      )}

      {!finished && due.length === 0 && total > 0 && (
        <p className="mt-4 text-muted">Nothing due. Come back tomorrow.</p>
      )}

      {total === 0 && (
        <p className="mt-4 text-muted">
          No cards yet. Make a deck from one of your notes and CampusOS will
          tell you which ones to review each day.
        </p>
      )}

      {notes.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Make cards from a note &middot; {decksLeft} left today
          </p>
          <div className="mt-2 space-y-2">
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                disabled={pending || decksLeft <= 0}
                onClick={() => start(async () => {
                  setError(null);
                  const res = await generateCards(n.id, courseId);
                  if (res && "error" in res && res.error) setError(res.error);
                  else if (res && "made" in res) setMade(res.made ?? 0);
                })}
                className="flex w-full items-center gap-3 rounded-2xl bg-card px-5 py-4 text-left disabled:opacity-40"
              >
                <span className="min-w-0 flex-1 truncate font-bold text-ink">{n.title}</span>
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-muted">
                  {pending ? "Making..." : "Make cards"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {made !== null && (
        <p className="mt-4 text-sm font-bold text-ink">{made} cards made. Reload to review them.</p>
      )}
      {error && <p className="mt-4 text-sm font-bold text-alarm">{error}</p>}
    </section>
  );
}
