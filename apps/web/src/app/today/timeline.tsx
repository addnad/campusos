"use client";

import Link from "next/link";
import type { Item } from "@/modules/academics/timeline";
import { clockTime, relative } from "@/modules/academics/relative";
import { useNow } from "@/components/use-now";

export function TimelineRow({ item, nowIso }: { item: Item; nowIso: string }) {
  const now = useNow(nowIso);
  const late = item.type === "due" && item.at < now;

  return (
    <Link href={`/courses/${item.courseId}`} className="flex items-stretch gap-4 rounded-2xl bg-card p-4 transition-transform active:scale-[0.99]">
      <span className="w-1.5 shrink-0 rounded-full" style={{ background: `var(--color-${item.colour})` }} />

      <span className="w-16 shrink-0">
        <span className="block font-mono text-sm font-bold text-ink">{clockTime(item.at)}</span>
        <span className="block font-mono text-xs text-muted">
          {item.type === "class" ? clockTime(item.endsAt) : item.kind.toLowerCase()}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">{item.code}</span>
        <span className="block truncate text-sm text-muted">
          {item.type === "class"
            ? [item.venue, item.lecturer].filter(Boolean).join(" \u00b7 ") || item.title
            : item.title}
        </span>
      </span>

      {/* A class that has finished is over, not late: late is for a
          deadline you missed. */}
      <span className={`shrink-0 self-center rounded-full px-3 py-1 font-mono text-[11px] uppercase ${late ? "bg-alarm text-ground" : "bg-sunken text-muted"}`} suppressHydrationWarning>
        {item.type === "class" && item.endsAt < now ? "Done" : relative(item.at, now)}
      </span>
    </Link>
  );
}
