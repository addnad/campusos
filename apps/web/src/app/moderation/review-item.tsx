"use client";

import { useState, useTransition } from "react";
import { upholdReport, dismissReport } from "./actions";
import { reasonLabel } from "@/modules/moderation/reasons";

export function ReviewItem({ item, standing }: {
  item: {
    messageId: string; body: string; deleted: boolean; room: string; level: string;
    authorHandle: string | null; authorFlagged: boolean; reporters: string[];
    reasons: { reason: string | null; note: string | null; by: string }[];
  };
  standing: { rooms: number; strikes: number; removals: number };
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return (
      <li className="rounded-2xl bg-sunken px-4 py-3 text-sm text-muted">
        {done}
      </li>
    );
  }

  const btn = "rounded-full px-4 py-2 text-sm font-bold";

  return (
    <li className="rounded-2xl bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-sm uppercase text-ink">{item.room}</span>
        <span className="label text-muted">{item.level}</span>
        <span className="label text-alarm">
          {item.reporters.length} {item.reporters.length === 1 ? "report" : "reports"}
        </span>
        {item.authorFlagged && (
          <span className="rounded-full bg-alarm px-2 py-0.5 font-mono text-[10px] uppercase text-ground">Flagged</span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted">
        @{item.authorHandle ?? "student"} &middot; {standing.strikes} {standing.strikes === 1 ? "strike" : "strikes"} across {standing.rooms} {standing.rooms === 1 ? "room" : "rooms"}
        {standing.removals > 0 ? ` \u00b7 ${standing.removals} removed` : ""}
      </p>

      <p className={`mt-3 whitespace-pre-wrap break-words rounded-xl bg-sunken p-3 ${item.deleted ? "italic text-muted" : "text-ink"}`}>
        {item.deleted ? "Already deleted" : item.body}
      </p>

      <ul className="mt-3 space-y-1">
        {item.reasons.map((r, i) => (
          <li key={i} className="text-sm">
            <span className="font-bold text-ink">{reasonLabel(r.reason)}</span>
            <span className="text-muted"> &mdash; @{r.by}</span>
            {r.note && <span className="block text-muted">&ldquo;{r.note}&rdquo;</span>}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => start(async () => {
          const res = await upholdReport(item.messageId, true);
          if (res && "ok" in res) setDone(`Upheld \u00b7 strike ${res.strikes} \u00b7 ${res.state.toLowerCase()}${res.flagged ? " \u00b7 account flagged" : ""}`);
        })} className={`${btn} bg-alarm text-ground`}>
          Uphold and delete
        </button>

        <button type="button" disabled={pending} onClick={() => start(async () => {
          const res = await upholdReport(item.messageId, false);
          if (res && "ok" in res) setDone(`Upheld, kept \u00b7 strike ${res.strikes}`);
        })} className={`${btn} border-2 border-ink text-ink`}>
          Uphold, keep message
        </button>

        <button type="button" disabled={pending} onClick={() => start(async () => {
          await dismissReport(item.messageId);
          setDone("Dismissed");
        })} className={`${btn} text-muted`}>
          Dismiss
        </button>
      </div>
    </li>
  );
}
