"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLiveMessages, type LiveMessage } from "./use-live-messages";
import { MessageSheet, type SheetTarget } from "./message-sheet";
import { useLongPress } from "./use-long-press";
import { Composer } from "./composer";
import { toggleReaction } from "../actions";
import { splitMentions } from "@/modules/collaboration/mentions";

function stamp(iso: string) {
  const d = new Date(iso);
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Row({ m, me, myHandle, onHold, onReact, onSwipeReply, onOpenImage }: { m: LiveMessage; me: string; myHandle: string | null; onHold: (t: SheetTarget) => void; onReact: (messageId: string, emoji: string) => void; onSwipeReply: (m: { id: string; body: string }) => void; onOpenImage: (url: string) => void }) {
  const mine = m.authorId === me;

  // A join is not something a person said: no bubble, no author line, no
  // reactions, no reporting.
  if (m.isSystem) {
    // "@john joined" reads oddly to john. It still marks where their
    // history starts, which matters when they only see the last 50.
    const text = mine ? "You joined" : m.body;
    return (
      <li className="flex justify-center py-1">
        <span className="rounded-full bg-sunken px-3 py-1 text-xs text-muted">{text}</span>
      </li>
    );
  }

  const hold = useLongPress(() => { if (!m.deleted) onHold({ id: m.id, body: m.body, mine, reported: false }); });

  // Swipe right to reply, as every chat app does.
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  /// A long message would otherwise push the whole room off screen.
  const LONG = 320;
  const [expanded, setExpanded] = useState(false);
  const long = m.body.length > LONG;

  /// A message that names you should be findable in a wall of text, but
  /// a permanent highlight becomes noise once you have seen it.
  const [flash, setFlash] = useState(Boolean(m.mentionsMe));
  useEffect(() => {
    if (!m.mentionsMe) return;
    const t = setTimeout(() => setFlash(false), 4000);
    return () => clearTimeout(t);
  }, [m.mentionsMe]);

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
        className={`mt-1 max-w-[85%] select-none rounded-2xl px-4 py-3 transition-colors duration-700 ${
          mine ? "bg-ink text-ground" : flash ? "bg-volt text-ink" : "bg-card text-ink"
        }`}
      >
        {m.replyTo && (
          <div className={`mb-2 border-l-2 pl-2 text-sm ${mine ? "border-ground/40 text-ground/70" : "border-ink/25 text-muted"}`}>
            <span className="block font-bold">@{m.replyTo.handle ?? "student"}</span>
            <span className="line-clamp-2">{m.replyTo.body}</span>
          </div>
        )}
        {m.file?.url && (
          m.file.type?.startsWith("image/") ? (
            <button type="button" onClick={() => onOpenImage(m.file!.url!)} className="mb-2 block w-full overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.file.url} alt={m.file.name ?? "Attachment"} className="max-h-80 w-full rounded-xl object-contain" />
            </button>
          ) : (
            <a href={m.file.url} target="_blank" rel="noreferrer" download={m.file.name ?? undefined} className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-2 ${mine ? "bg-ground/15" : "bg-sunken"}`}>
              <span className="text-lg">&#128196;</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{m.file.name ?? "File"}</span>
                {m.file.size && (
                  <span className="block font-mono text-[11px] opacity-70">
                    {m.file.size < 1024 * 1024
                      ? `${Math.max(1, Math.round(m.file.size / 1024))} KB`
                      : `${(m.file.size / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                )}
              </span>
            </a>
          )
        )}

        {m.body && (
          <p className="whitespace-pre-wrap break-words">
            {splitMentions(long && !expanded ? `${m.body.slice(0, LONG).trimEnd()}...` : m.body).map((part, i) =>
              part.handle ? (
                <span key={i} className={`rounded px-0.5 font-bold ${
                  part.handle === myHandle
                    ? (mine ? "bg-ground/25" : "bg-volt text-ink")
                    : "opacity-80"
                }`}>{part.text}</span>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        )}
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

export function MessageList({ communityId, me, myHandle, initial, mutedUntil, handles }: {
  communityId: string; me: string; myHandle: string | null; initial: LiveMessage[]; mutedUntil: string | null; handles: string[];
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
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
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
          <Row key={m.id} m={m} me={me} myHandle={myHandle} onHold={setSheet} onReact={react} onSwipeReply={setReplyTo} onOpenImage={setLightbox} />
        ))}
      </ul>
      <div ref={end} />

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-[min(100%,52rem)] rounded-2xl object-contain" />
          <button type="button" aria-label="Close" className="absolute right-4 top-4 text-3xl text-ground">&times;</button>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-6">
          <p className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-ground">{toast}</p>
        </div>
      )}

      {typing.length > 0 && (
        <p className="mt-3 text-xs italic text-muted">
          {typing.length === 1 ? `@${typing[0]} is typing...` : `${typing.length} people are typing...`}
        </p>
      )}

      <MessageSheet communityId={communityId} target={sheet} onClose={() => setSheet(null)} onReply={setReplyTo} onReact={react} onReported={() => { setToast("Thanks — we will take a look."); setTimeout(() => setToast(null), 3500); }} />

      <Composer
        communityId={communityId}
        mutedUntil={mutedUntil ? new Date(mutedUntil) : null}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        handles={handles}
        onTyping={setTypingFlag}
        onSent={(body, replyToId, file) => {
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
            file,
            replyTo: quoted ? { id: quoted.id, body: quoted.body, handle: quoted.handle } : null,
          }]);
          refresh();
        }}
      />
    </>
  );
}
