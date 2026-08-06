"use client";

import { useState } from "react";
import { Suggestions } from "@/app/courses/[id]/suggestions";
import type { ClassSuggestion, AssessmentSuggestion } from "@/modules/academics/suggestions";

type Group = {
  courseId: string;
  code: string;
  classes: ClassSuggestion[];
  assessments: AssessmentSuggestion[];
};

/// Inline rather than its own page: Today is the screen a student lives
/// on, and a navigation for something optional is a page load they did
/// not ask for.
export function SuggestionDrawer({ groups, total }: { groups: Group[]; total: number }) {
  const [open, setOpen] = useState(false);
  if (total === 0) return null;

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl bg-sunken px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-ground">
          {total}
        </span>
        <span className="min-w-0 flex-1 text-sm text-ink">
          {total === 1 ? "suggestion" : "suggestions"} from your coursemates
        </span>
        <span aria-hidden className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          &#9662;
        </span>
      </button>

      {open && (
        <div className="mt-4 rounded-3xl bg-sunken p-5">
          <p className="text-sm text-muted">Nothing is added until you say so.</p>
          {groups.map((g) => (
            <div key={g.courseId} className="mt-4 first:mt-3">
              <p className="font-display text-sm uppercase text-ink">{g.code}</p>
              <Suggestions courseId={g.courseId} classes={g.classes} assessments={g.assessments} heading={false} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
