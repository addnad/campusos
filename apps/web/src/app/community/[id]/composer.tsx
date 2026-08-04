"use client";

import { useRef, useState, useTransition } from "react";
import { postMessage } from "../actions";

export function Composer({ communityId, mutedUntil, replyTo, onClearReply, onSent, onTyping }: {
  communityId: string;
  mutedUntil: Date | null;
  replyTo?: { id: string; body: string } | null;
  onClearReply?: () => void;
  onSent?: (body: string, replyToId: string | null) => void;
  onTyping?: (on: boolean) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  /// Cleared after a pause: the flag was only unset on send, so stopping
  /// without sending left it true and every poll pushed the window
  /// forward again.
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const muted = mutedUntil && mutedUntil > new Date();
  if (muted) {
    return (
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/10 bg-ground px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="mx-auto max-w-2xl text-sm text-muted">
          You are timed out here until {mutedUntil.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
        </p>
      </div>
    );
  }

  function send() {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const fd = new FormData();
      fd.set("body", text);
      if (replyTo) fd.set("replyToId", replyTo.id);
      const res = await postMessage(communityId, fd);
      if (res && "error" in res && res.error) setError(res.error);
      else {
        setBody(""); setError(null); onClearReply?.(); onTyping?.(false);
        onSent?.(text, replyTo?.id ?? null);
        box.current?.focus();
      }
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/10 bg-ground px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {replyTo && (
        <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-2xl bg-sunken px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-muted">Replying to: {replyTo.body}</span>
          <button type="button" onClick={onClearReply} aria-label="Cancel reply" className="text-lg leading-none text-muted hover:text-ink">&times;</button>
        </div>
      )}
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <textarea
          ref={box}
          rows={1}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            const active = e.target.value.trim().length > 0;
            onTyping?.(active);
            if (idle.current) clearTimeout(idle.current);
            if (active) idle.current = setTimeout(() => onTyping?.(false), 2500);
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message your coursemates"
          className="max-h-32 min-h-11 flex-1 resize-none truncate rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
        <button type="button" onClick={send} disabled={pending || !body.trim()} aria-label="Send" className="h-11 w-11 shrink-0 rounded-full bg-ink text-lg font-bold text-ground disabled:opacity-30">
          &uarr;
        </button>
      </div>
      {error && <p className="mx-auto mt-2 max-w-2xl text-sm font-bold text-alarm">{error}</p>}
    </div>
  );
}
