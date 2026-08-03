"use client";

import { useState, useTransition } from "react";
import { removeClassSession, removeAssessment } from "./actions";

export function Remove({ id, courseId, kind, label }: { id: string; courseId: string; kind: "session" | "assessment"; label: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-1">
        <button type="button" disabled={pending} onClick={() => start(async () => {
          if (kind === "session") await removeClassSession(id, courseId);
          else await removeAssessment(id, courseId);
        })} className="rounded-full bg-alarm px-3 py-1 font-mono text-[11px] uppercase text-ground disabled:opacity-50">
          {pending ? "..." : "Remove"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="px-2 font-mono text-[11px] uppercase text-muted">No</button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} aria-label={`Remove ${label}`} className="shrink-0 self-center px-2 text-xl leading-none text-muted hover:text-alarm">
      &times;
    </button>
  );
}
