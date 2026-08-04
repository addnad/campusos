"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LiveMessage = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  handle: string | null;
  reactions: { emoji: string; profileId: string }[];
  replyTo: { id: string; body: string; handle: string | null } | null;
};

const EVERY = 5000;

/// Polls while the tab is visible and stops when it is not. Coming back
/// fetches the whole gap at once, so nothing is missed — it just arrives
/// when the student looks.
export function useLiveMessages(communityId: string, initial: LiveMessage[]) {
  const [messages, setMessages] = useState(initial);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  /// Set while the student is typing; sent with the next poll rather
  /// than as its own request.
  const iAmTyping = useRef(false);
  const latest = useRef(initial.at(-1)?.createdAt ?? null);
  const busy = useRef(false);

  const poll = useCallback(async () => {
    if (busy.current || document.visibilityState !== "visible") return;
    busy.current = true;
    try {
      const params = new URLSearchParams();
      if (latest.current) params.set("since", latest.current);
      if (iAmTyping.current) params.set("typing", "1");
      const url = `/api/community/${communityId}/messages?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setOnline(data.online ?? []);
      setTyping(data.typing ?? []);

      if (data.reactions?.length) {
        const fresh = new Map<string, { emoji: string; profileId: string }[]>(
          data.reactions.map((r: { id: string; reactions: { emoji: string; profileId: string }[] }) => [r.id, r.reactions]),
        );
        setMessages((prev) => prev.map((m) => {
          const next = fresh.get(m.id);
          if (!next) return m;
          const same = next.length === m.reactions.length &&
            next.every((r) => m.reactions.some((x) => x.emoji === r.emoji && x.profileId === r.profileId));
          return same ? m : { ...m, reactions: next };
        }));
      }

      if (data.messages?.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m: LiveMessage) => !seen.has(m.id));
          if (fresh.length === 0) return prev;
          latest.current = fresh.at(-1).createdAt;
          return [...prev, ...fresh];
        });
      }
    } catch {
      // A dropped poll is not worth surfacing; the next one catches up.
    } finally {
      busy.current = false;
    }
  }, [communityId]);

  useEffect(() => {
    const t = setInterval(poll, EVERY);
    const onVisible = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [poll]);

  const setTypingFlag = useCallback((on: boolean) => { iAmTyping.current = on; }, []);

  return { messages, setMessages, refresh: poll, online, typing, setTypingFlag };
}
