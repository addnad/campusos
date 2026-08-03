"use client";

import { useTransition, useState } from "react";
import { acceptClassSuggestion, acceptAssessmentSuggestion } from "./actions";
import type { ClassSuggestion, AssessmentSuggestion } from "@/modules/academics/suggestions";
import { clock, dayName } from "@/modules/academics/format-time";

function From({ count }: { count: number }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
      {count === 1 ? "1 coursemate" : `${count} coursemates`}
    </span>
  );
}

export function Suggestions({ courseId, classes, assessments, heading = true }: { courseId: string; classes: ClassSuggestion[]; assessments: AssessmentSuggestion[]; heading?: boolean }) {
  const [pending, start] = useTransition();
  const [hidden, setHidden] = useState<string[]>([]);

  const shownClasses = classes.filter((c) => !hidden.includes(c.key));
  const shownAssessments = assessments.filter((a) => !hidden.includes(a.key));
  if (shownClasses.length + shownAssessments.length === 0) return null;

  return (
    <section className={heading ? "mt-10 rounded-3xl bg-sunken p-5" : "mt-3"}>
      {heading && (
        <>
          <p className="font-display text-lg uppercase text-ink">From your coursemates</p>
          <p className="mt-1 text-sm text-muted">Nothing is added until you say so.</p>
        </>
      )}

      <div className={heading ? "mt-4 space-y-2" : "space-y-2"}>
        {shownClasses.map((c) => (
          <div key={c.key} className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <span className="w-12 shrink-0 font-mono text-sm font-bold uppercase text-ink">{dayName(c.weekday)}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{clock(c.startsAt)} &ndash; {clock(c.endsAt)}</span>
              <span className="block truncate text-sm text-muted">
                {[c.venue, c.lecturer].filter(Boolean).join(" \u00b7 ") || "No venue given"}
              </span>
              <From count={c.count} />
            </span>
            <button type="button" disabled={pending} onClick={() => start(async () => {
              const fd = new FormData();
              fd.set("weekday", String(c.weekday));
              fd.set("startsAt", String(c.startsAt));
              fd.set("endsAt", String(c.endsAt));
              if (c.venue) fd.set("venue", c.venue);
              if (c.lecturer) fd.set("lecturer", c.lecturer);
              await acceptClassSuggestion(courseId, fd);
            })} className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-bold text-ground disabled:opacity-40">Add</button>
            <button type="button" onClick={() => setHidden((h) => [...h, c.key])} aria-label="Not mine" className="shrink-0 px-1 text-xl leading-none text-muted hover:text-ink">&times;</button>
          </div>
        ))}

        {shownAssessments.map((a) => (
          <div key={a.key} className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{a.title}</span>
              <span className="block text-sm text-muted">
                {a.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &middot; {a.kind.toLowerCase()}
              </span>
              <From count={a.count} />
            </span>
            <button type="button" disabled={pending} onClick={() => start(async () => {
              const fd = new FormData();
              fd.set("kind", a.kind);
              fd.set("title", a.title);
              fd.set("dueAt", a.dueAt.toISOString());
              await acceptAssessmentSuggestion(courseId, fd);
            })} className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-bold text-ground disabled:opacity-40">Add</button>
            <button type="button" onClick={() => setHidden((h) => [...h, a.key])} aria-label="Not mine" className="shrink-0 px-1 text-xl leading-none text-muted hover:text-ink">&times;</button>
          </div>
        ))}
      </div>
    </section>
  );
}
