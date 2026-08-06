"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FreeWindow } from "@/modules/intelligence/windows";

const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function span(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/// Advisory, not instruction (ADR-003). It arrives, holds for a moment
/// so it is noticed, then settles — a permanent animation on a screen
/// opened six times a day becomes wallpaper.
export function FreeWindows({ windows }: { windows: (Omit<FreeWindow, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string })[] }) {
  const [held, setHeld] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHeld(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (windows.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg uppercase text-ink">You&apos;ve got free time</h2>

      <ul className="mt-3 space-y-2">
        {windows.map((w, i) => {
          const body = (
            <>
              <span className="flex items-baseline gap-3">
                <span className="font-display text-xl leading-none text-ink">{span(w.minutes)}</span>
                <span className="font-mono text-sm text-muted">
                  {clock(new Date(w.startsAt))} &ndash; {clock(new Date(w.endsAt))}
                </span>
              </span>

              <span className="mt-1 block text-sm text-muted">
                After {w.after}, before {w.before}
              </span>

              {w.suggestion && (
                <span className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3 text-sm font-bold text-ink">
                  {w.colour && (
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--color-${w.colour})` }} />
                  )}
                  {w.suggestion}
                  <span aria-hidden className="ml-auto">&rarr;</span>
                </span>
              )}
            </>
          );

          const shell = `rise block rounded-2xl p-4 transition-colors duration-1000 ${
            held && i === 0 ? "bg-volt/40" : "bg-sunken"
          }`;

          return (
            <li key={i}>
              {w.courseId ? (
                <Link href={`/courses/${w.courseId}`} className={`${shell} transition-transform active:scale-[0.99]`} style={{ animationDelay: `${i * 80}ms` }}>
                  {body}
                </Link>
              ) : (
                <span className={shell} style={{ animationDelay: `${i * 80}ms` }}>{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
