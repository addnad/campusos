"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Mark } from "@/components/ui/mark";

type Turn = { id: string; question: string; answer: string };

// A rotating word rather than a spinner: it reads as the tutor engaging
// with the question instead of a machine being slow.
const THINKING = [
  "Thinking", "Working it through", "Checking your notes",
  "Considering", "Putting it together", "Looking at this",
  "Reading around it", "Finding the thread", "Weighing it up",
  "Getting to the point", "Lining it up", "Turning it over",
  "Making sense of it", "Sorting it out", "Piecing it together",
];

function Thinking() {
  const [i, setI] = useState(() => Math.floor(Math.random() * THINKING.length));
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % THINKING.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="flex items-center gap-2 py-0.5">
      <Mark size={20} blink="thinking" className="shrink-0" />
      <span className="text-sm italic text-muted">{THINKING[i]}...</span>
    </span>
  );
}

export function TutorPanel({ courseId, code, turns: initial, left: startLeft, limit }: {
  courseId: string; code: string; turns: Turn[]; left: number; limit: number;
}) {
  const [turns, setTurns] = useState(initial);
  const [left, setLeft] = useState(startLeft);
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  const spent = left <= 0;
  const busy = streaming !== null;

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [turns.length, streaming]);

  async function send() {
    const q = question.trim();
    if (q.length < 3 || busy || spent) return;

    setError(null);
    setAsked(q);
    setStreaming("");
    setQuestion("");
    if (box.current) box.current.style.height = "auto";

    try {
      const res = await fetch(`/api/courses/${courseId}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok || !res.body) {
        setError(await res.text());
        setStreaming(null);
        setAsked(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }

      setTurns((t) => [...t, { id: `t-${Date.now()}`, question: q, answer: full }]);
      setLeft((n) => n - 1);
    } catch {
      setError("Lost the connection. Try again.");
    } finally {
      setStreaming(null);
      setAsked(null);
    }
  }

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink/10 pb-3">
        <h2 className="font-display text-lg uppercase text-ink">Tutor</h2>
        {/* The shape promises a conversation, so the ceiling stays in view. */}
        <span className="shrink-0 label text-muted">
          {left} of {limit} today
        </span>
      </div>

      <div className="min-h-[40vh] space-y-5 py-6">
        {turns.length === 0 && !asked && (
          <p className="py-8 text-center text-muted">
            Ask about {code}. The tutor reads your notes and what you have coming
            up &mdash; it will not invent a deadline or a mark scheme.
          </p>
        )}

        {turns.map((t) => (
          <div key={t.id} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-ink px-5 py-3 text-ground">
                {t.question}
              </p>
            </div>
            <div className="flex justify-start">
              <div className="prose-tutor max-w-[92%] rounded-3xl rounded-bl-lg bg-card px-5 py-4">
                <Markdown>{t.answer}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {asked && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-ink px-5 py-3 text-ground">
                {asked}
              </p>
            </div>
            <div className="flex justify-start">
              <div className="prose-tutor max-w-[92%] rounded-3xl rounded-bl-lg bg-card px-5 py-4">
                {streaming ? <Markdown>{streaming}</Markdown> : <Thinking />}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm font-bold text-alarm">{error}</p>}
        <div ref={end} />
      </div>

      <div className="sticky bottom-20 flex items-end gap-2 rounded-3xl bg-ground py-2">
        <textarea
          ref={box}
          rows={1}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={spent || busy}
          placeholder={spent ? "Come back tomorrow" : `Ask about ${code}`}
          className="max-h-36 min-h-12 flex-1 resize-none rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:text-muted disabled:opacity-50"
        />
        <button type="button" onClick={send} disabled={busy || spent || question.trim().length < 3} aria-label="Ask" className="h-12 w-12 shrink-0 rounded-full bg-ink text-lg font-bold text-ground disabled:opacity-30">
          &uarr;
        </button>
      </div>
    </section>
  );
}
