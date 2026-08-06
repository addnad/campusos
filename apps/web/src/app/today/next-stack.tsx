"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Item } from "@/modules/academics/timeline";
import { clockTime as time, relative as when } from "@/modules/academics/relative";
import { useNow } from "@/components/use-now";

/// Swipeable, but it returns to the first card after 10s idle: the point
/// of this screen is knowing what is next, so peeking ahead should not
/// leave a student looking at Thursday.
export function NextStack({ items, nowIso }: { items: Item[]; nowIso: string }) {
  const now = useNow(nowIso);
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (idle.current) clearTimeout(idle.current); }, []);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));

    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      el.scrollTo({ left: 0, behavior: "smooth" });
    }, 10000);
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]{display:none}">
        {items.map((item, i) => {
          const isToday = item.at.toDateString() === now.toDateString();
          return (
            <Link key={`${item.type}-${item.id}`} href={`/courses/${item.courseId}`} className="w-full shrink-0 snap-center rounded-3xl p-6" style={{ background: `var(--color-${item.colour})` }}>
              <div className="flex items-start justify-between gap-4">
                <span className="label text-ink/70">
                  {i === 0 ? (item.type === "class" ? "Next class" : "Next due") : item.type === "class" ? "Then" : "Then due"}
                </span>
                <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] uppercase text-ground" suppressHydrationWarning>{when(item.at, now)}</span>
              </div>

              <p className="mt-4 font-display text-4xl leading-none text-ink">
                {time(item.at)}
                {item.type === "class" && <span className="ml-2 font-sans text-base font-bold text-ink/60">&rarr; {time(item.endsAt)}</span>}
              </p>

              <p className="mt-3 font-display text-2xl uppercase leading-none text-ink">{item.code}</p>
              <p className="mt-1 line-clamp-1 text-ink/80">{item.title}</p>

              {item.type === "class" && (item.venue || item.lecturer) && (
                <p className="mt-4 border-t border-ink/20 pt-3 text-sm text-ink/80">
                  {[item.venue, item.lecturer].filter(Boolean).join(" \u00b7 ")}
                </p>
              )}

              {!isToday && (
                <p className="mt-3 label text-ink/60">
                  {item.at.toLocaleDateString("en-GB", { weekday: "long" })}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((it, i) => (
            <span key={`${it.type}-${it.id}`} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
