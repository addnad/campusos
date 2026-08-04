"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLiveMessages, type LiveMessage } from "./use-live-messages";
import { MessageSheet, type SheetTarget } from "./message-sheet";
import { useLongPress } from "./use-long-press";
import { Composer } from "./composer";
import { toggleReaction } from "../actions";

function stamp(iso: string) {
  const d = new Date(iso);
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Row({ m, me, onHold, onReact, onSwipeReply }: { m: LiveMessage; me: string; onHold: (t: SheetTarget) => void; onReact: (messageId: string, emoji: string) => void; onSwipeReply: (m: { id: string; body: string }) => void }) {
  const mine = m.authorId === me;
  const hold = useLongPress(() => onHold({ id: m.id, body: m.body, mine, reported: false }));

  // Swipe right to reply, as every chat app does.
  const startX = useRef(0);
  const [dx, setDx] = useState(0);

  // Group reactions so five thumbs-up read as one chip with a count.
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const r of m.reactions) {
    const g = grouped.get(r.emoji) ?? { count: 0, mine: false };
    g.count += 1;
    if (r.profileId === me) g.mine = true;
    grouped.set(r.emoji, g);
  }

  return (
    <li className={mine ? "flex flex-col items-end" : "flex flex-col items-start"}>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-sm lowercase text-ink">@{m.handle ?? "student"}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{stamp(m.createdAt)}</span>
      </div>

      <div
        {...hold}
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; hold.onTouchStart(); }}
        onTouchMove={(e) => {
          hold.onTouchMove();
          const d = e.touches[0].clientX - startX.current;
          if (d > 0) setDx(Math.min(d, 72));
        }}
        onTouchEnd={() => {
          hold.onTouchEnd();
          if (dx > 48) onSwipeReply({ id: m.id, body: m.body });
          setDx(0);
        }}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform 160ms" }}
        className={`mt-1 max-w-[85%] select-none rounded-2xl px-4 py-3 ${mine ? "bg-ink text-ground" : "bg-card text-ink"}`}
      >
        {m.replyTo && (
          <div className={`mb-2 border-l-2 pl-2 text-sm ${mine ? "border-ground/40 text-ground/70" : "border-ink/25 text-muted"}`}>
            <span className="block font-bold">@{m.replyTo.handle ?? "student"}</span>
            <span className="line-clamp-2">{m.replyTo.body}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
      </div>

      {grouped.size > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {[...grouped.entries()].map(([emoji, g]) => (
            <button key={emoji} type="button" onClick={() => onReact(m.id, emoji)} className={`rounded-full px-2 py-0.5 text-xs ${g.mine ? "bg-ink text-ground" : "bg-sunken text-ink"}`}>
              {emoji} {g.count > 1 ? g.count : ""}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

export function MessageList({ communityId, me, initial, mutedUntil }: {
  communityId: string; me: string; initial: LiveMessage[]; mutedUntil: string | null;
}) {
  const { messages, setMessages, refresh } = useLiveMessages(communityId, initial);
  const [, startReact] = useTransition();

  /// Applied locally first: polling only fetches messages newer than the
  /// last one, so a reaction on an existing message would never arrive.
  function react(messageId: string, emoji: string) {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const had = m.reactions.some((r) => r.emoji === emoji && r.profileId === me);
      return {
        ...m,
        reactions: had
          ? m.reactions.filter((r) => !(r.emoji === emoji && r.profileId === me))
          : [...m.reactions, { emoji, profileId: me }],
      };
    }));
    startReact(async () => { await toggleReaction(communityId, messageId, emoji); });
  }
  const [sheet, setSheet] = useState<SheetTarget>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; body: string } | null>(null);
  const end = useRef<HTMLDivElement>(null);

  // Follow new messages, the way any chat does.
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  return (
    <>
      <ul className="space-y-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-muted">
            Nobody has said anything yet. Ask about the assignment, share where
            the lecture moved to.
          </p>
        )}
        {messages.map((m) => (
          <Row key={m.id} m={m} me={me} onHold={setSheet} onReact={react} onSwipeReply={setReplyTo} />
        ))}
      </ul>
      <div ref={end} />

      <MessageSheet communityId={communityId} target={sheet} onClose={() => setSheet(null)} onReply={setReplyTo} onReact={react} />

      <Composer
        communityId={communityId}
        mutedUntil={mutedUntil ? new Date(mutedUntil) : null}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSent={refresh}
      />
    </>
  );
}
