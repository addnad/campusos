"use client";

import Link from "next/link";
import { useState } from "react";

type Course = { id: string; code: string; colour: string; hasTimes: boolean };

const ACTIONS = [
  {
    key: "class", label: "Class time", tab: "",
    icon: (<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  },
  {
    key: "work", label: "Assignment", tab: "",
    icon: (<><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4" /><path d="m8.5 14 2.2 2.2L15.5 11" /></>),
  },
  {
    key: "tutor", label: "Ask tutor", tab: "?tab=tutor",
    icon: (<><path d="M21 12a8 8 0 0 1-8 8H7.5L3 21.5l1-4.2A8 8 0 1 1 21 12Z" /><path d="M10 9.2a2.2 2.2 0 1 1 2.6 2.16c-.5.1-.85.55-.85 1.06v.33" /><circle cx="11.75" cy="15.6" r=".55" fill="currentColor" stroke="none" /></>),
  },
  {
    key: "notes", label: "Note", tab: "?tab=notes",
    icon: (<><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /><path d="M14.5 5.5l3 3" /></>),
  },
] as const;

/// Things a student does often, currently three taps deep inside a
/// course. Below the timeline so they never compete with what is next.
export function QuickActions({ courses }: { courses: Course[] }) {
  const [picking, setPicking] = useState<(typeof ACTIONS)[number] | null>(null);

  if (courses.length === 0) return null;

  // If only one course is missing class times, adding one is unambiguous.
  const missingTimes = courses.filter((c) => !c.hasTimes);
  const shortcut = (key: string) =>
    key === "class" && missingTimes.length === 1 ? missingTimes[0] : null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg uppercase text-ink">Quick</h2>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {ACTIONS.map((a) => {
          const direct = shortcut(a.key);
          const inner = (
            <>
              <span className="flex h-14 w-full items-center justify-center rounded-2xl bg-sunken">
                <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  {a.icon}
                </svg>
              </span>
              <span className="mt-1.5 block text-center text-xs text-ink">{a.label}</span>
              {direct && <span className="block text-center text-[10px] text-muted">{direct.code}</span>}
            </>
          );
          const cls = "block text-ink transition-transform active:scale-[0.96]";

          return direct ? (
            <Link key={a.key} href={`/courses/${direct.id}${a.tab}`} className={cls}>{inner}</Link>
          ) : (
            <button key={a.key} type="button" onClick={() => setPicking(a)} className={cls}>{inner}</button>
          );
        })}
      </div>

      {picking && (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal>
          <button type="button" aria-label="Close" onClick={() => setPicking(null)} className="absolute inset-0 bg-ink/40" />

          <div className="relative mx-auto w-full max-w-lg rounded-t-3xl bg-ground p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/20" />
            <p className="px-2 pb-2 label text-muted">{picking.label} &mdash; which course?</p>

            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link href={`/courses/${c.id}${picking.tab}`} onClick={() => setPicking(null)} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-sunken">
                    <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: `var(--color-${c.colour})` }} />
                    <span className="font-bold text-ink">{c.code}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
