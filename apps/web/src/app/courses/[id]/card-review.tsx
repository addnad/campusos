"use client";

import { useState, useTransition } from "react";
import { reviewCard } from "./card-actions";

type Card = { id: string; front: string; back: string };

/// One at a time, flipped before answering: seeing the answer alongside
/// the question is not recall, and recall is the whole point.
export function CardReview({ cards, onDone }: { cards: Card[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [pending, start] = useTransition();

  const card = cards[i];
  const last = i >= cards.length - 1;

  function answer(correct: boolean) {
    start(async () => {
      await reviewCard(card.id, correct);
      setScore((s) => correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 });
      if (last) onDone();
      else { setI(i + 1); setFlipped(false); }
    });
  }

  if (!card) return null;

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {i + 1} of {cards.length}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {score.right} knew &middot; {score.wrong} missed
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="mt-3 flex min-h-56 w-full flex-col justify-center rounded-3xl bg-card p-6 text-left"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {flipped ? "Answer" : "Question"}
        </span>
        <span className="mt-3 text-lg leading-relaxed text-ink">
          {flipped ? card.back : card.front}
        </span>
        {!flipped && (
          <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">
            Tap to see the answer
          </span>
        )}
      </button>

      {flipped ? (
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={pending} onClick={() => answer(false)} className="flex-1 rounded-full border-2 border-ink px-5 py-4 font-bold text-ink disabled:opacity-40">
            Missed it
          </button>
          <button type="button" disabled={pending} onClick={() => answer(true)} className="flex-1 rounded-full bg-ink px-5 py-4 font-bold text-ground disabled:opacity-40">
            Knew it
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">
          Try to answer before you flip.
        </p>
      )}
    </div>
  );
}
