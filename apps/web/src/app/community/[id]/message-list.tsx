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
  const hold = useLongPress(() => { if (!m.deleted) onHold({ id: m.id, body: m.body, mine, reported: false }); });

  // Swipe right to reply, as every chat app does.
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  /// A long message would otherwise push the whole room off screen.
  const LONG = 320;
  const [expanded, setExpanded] = useState(false);
  const long = m.body.length > LONG;

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

      {m.deleted ? (
        <p className={`mt-1 max-w-[85%] rounded-2xl px-4 py-3 text-sm italic ${mine ? "bg-ink/10 text-muted" : "bg-card text-muted"}`}>
          Message deleted
        </p>
      ) : (
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
        <p className="whitespace-pre-wrap break-words">
          {long && !expanded ? `${m.body.slice(0, LONG).trimEnd()}...` : m.body}
        </p>
        {long && (
          <button type="button" onClick={() => setExpanded(!expanded)} className={`mt-1 text-sm font-bold underline underline-offset-2 ${mine ? "text-ground/70" : "text-muted"}`}>
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
      )}

      {!m.deleted && grouped.size > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {[...grouped.entries()].map(([emoji, g]) => (
            <button key={emoji} type="button" onClick={() => onReact(m.id, emoji)} className={`rounded-full px-2 py-0.5 text-xs ${g.mine ? (mine ? "bg-ground text-ink" : "bg-ink text-ground") : "bg-sunken text-ink"}`}>
              {emoji} {g.count > 1 ? g.count : ""}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

export function MessageList({ communityId, me, myHandle, initial, mutedUntil }: {
  communityId: string; me: string; myHandle: string | null; initial: LiveMessage[]; mutedUntil: string | null;
}) {
  const { messages, setMessages, refresh, online, typing, setTypingFlag } = useLiveMessages(communityId, initial);
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
      {online.length > 0 && (
        <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          <span className="h-2 w-2 rounded-full bg-mint" />
          {online.length === 1 ? `@${online[0]} is here` : `${online.length} here now`}
        </p>
      )}

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

      {typing.length > 0 && (
        <p className="mt-3 text-xs italic text-muted">
          {typing.length === 1 ? `@${typing[0]} is typing...` : `${typing.length} people are typing...`}
        </p>
      )}

      <MessageSheet communityId={communityId} target={sheet} onClose={() => setSheet(null)} onReply={setReplyTo} onReact={react} />

      <Composer
        communityId={communityId}
        mutedUntil={mutedUntil ? new Date(mutedUntil) : null}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onTyping={setTypingFlag}
        onSent={(body, replyToId) => {
          // Shown immediately; the next poll replaces it with the stored
          // row. Waiting up to five seconds to see your own message is
          // the difference between a chat feeling live and feeling broken.
          const pendingId = `pending-${Date.now()}`;
          const quoted = replyToId ? messages.find((x) => x.id === replyToId) : null;
          setMessages((prev) => [...prev, {
            id: pendingId,
            body,
            createdAt: new Date().toISOString(),
            authorId: me,
            handle: myHandle,
            reactions: [],
            replyTo: quoted ? { id: quoted.id, body: quoted.body, handle: quoted.handle } : null,
          }]);
          refresh();
        }}
      />
    </>
  );
}
