"use client";

import { useEffect, useState, useTransition } from "react";
import { reportMessage, deleteOwnMessage } from "../actions";
import { REPORT_REASONS } from "@/modules/moderation/reasons";

export const QUICK = ["\u{1F44D}", "\u{1F525}", "\u{1F602}", "\u{1F64F}", "\u{1F62D}", "\u{2757}"];

/// Curated rather than a full picker: a searchable library ships the
/// whole emoji dataset, which is real weight on a mid-range Android over
/// metered data, and reactions in a course room cluster on a handful.
const MORE = [
  "\u{1F44D}", "\u{1F44E}", "\u{1F525}", "\u{1F602}", "\u{1F923}", "\u{1F605}",
  "\u{1F64F}", "\u{1F62D}", "\u{2757}", "\u{2753}", "\u{1F914}", "\u{1F440}",
  "\u{2764}\u{FE0F}", "\u{1F495}", "\u{1F389}", "\u{1F44F}", "\u{1F4AF}", "\u{2705}",
  "\u{274C}", "\u{1F480}", "\u{1F621}", "\u{1F624}", "\u{1F644}", "\u{1F610}",
  "\u{1F971}", "\u{1F634}", "\u{1F926}", "\u{1F937}", "\u{1F4AA}", "\u{1F91D}",
  "\u{1F4DA}", "\u{270D}\u{FE0F}", "\u{1F4DD}", "\u{1F4C5}", "\u{23F0}", "\u{1F6A8}",
  "\u{1F9E0}", "\u{1F4A1}", "\u{1F31F}", "\u{1F680}",
];

export type SheetTarget = { id: string; body: string; mine: boolean; reported: boolean } | null;

/// A press-and-hold sheet rather than an inline menu: on a phone, a row
/// of tiny controls beside every message is both cluttered and hard to
/// hit.
export function MessageSheet({ communityId, target, onClose, onReply, onReact, onReported }: {
  communityId: string;
  target: SheetTarget;
  onClose: () => void;
  onReply: (m: { id: string; body: string }) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReported?: () => void;
}) {
  const [pending, start] = useTransition();
  const [showAll, setShowAll] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => { if (!target) { setShowAll(false); setReporting(false); setNote(""); } }, [target]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (target) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-ink hover:bg-sunken";

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div className="relative mx-auto w-full max-w-md rounded-t-3xl bg-ground p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-ink/20" />

        {showAll ? (
          <div className="mb-2 grid max-h-48 grid-cols-8 gap-1 overflow-y-auto px-1 pb-2">
            {MORE.map((e) => (
              <button key={e} type="button" onClick={() => { onReact(target.id, e); onClose(); }} className="rounded-lg py-1 text-xl transition-transform active:scale-90">
                {e}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 px-1 pb-2">
            {QUICK.map((e) => (
              <button key={e} type="button" onClick={() => { onReact(target.id, e); onClose(); }} className="rounded-full px-1.5 py-0.5 text-xl transition-transform active:scale-90">
                {e}
              </button>
            ))}
            <button type="button" onClick={() => setShowAll(true)} aria-label="More reactions" className="rounded-full bg-sunken px-2 py-0.5 text-lg font-bold text-muted">
              +
            </button>
          </div>
        )}

        <button type="button" onClick={() => { onReply({ id: target.id, body: target.body }); onClose(); }} className={row}>
          Reply
        </button>

        <button type="button" onClick={() => { navigator.clipboard?.writeText(target.body); onClose(); }} className={row}>
          Copy
        </button>

        {target.mine ? (
          <button type="button" disabled={pending} onClick={() => start(async () => { await deleteOwnMessage(communityId, target.id); onClose(); })} className={`${row} text-alarm`}>
            Delete
          </button>
        ) : target.reported ? (
          <p className="px-3 py-2.5 label text-muted">Already reported</p>
        ) : reporting ? (
          <div className="px-1 pb-1">
            <p className="px-2 pb-2 label text-muted">Why are you reporting this?</p>
            {REPORT_REASONS.map((r) => (
              <button key={r.key} type="button" disabled={pending} onClick={() => start(async () => {
                await reportMessage(communityId, target.id, r.key, note);
                onClose();
                onReported?.();
              })} className={row}>
                {r.label}
              </button>
            ))}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to add? (optional)" className="mt-1 w-full rounded-xl bg-card px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted" />
          </div>
        ) : (
          <button type="button" onClick={() => setReporting(true)} className={`${row} text-alarm`}>
            Report
          </button>
        )}
      </div>
    </div>
  );
}
