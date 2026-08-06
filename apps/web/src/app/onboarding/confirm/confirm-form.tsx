"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "../actions";

type Course = { courseId?: string; code: string; title: string; units: number };

const TOKENS = ["ember", "volt", "fern", "mint", "teal", "aqua", "indigo", "grape", "orchid", "hibiscus"];

export function ConfirmForm({ initial, programmeId, institutionId, campusId, level, semester, rollover }: { initial: Course[]; programmeId: string; institutionId: string; campusId: string; level: string; semester: number; rollover?: boolean }) {
  const [state, action, pending] = useActionState(completeOnboarding, null);
  const [courses, setCourses] = useState<Course[]>(initial);
  const [editing, setEditing] = useState(initial.length === 0);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [units, setUnits] = useState("3");

  const totalUnits = courses.reduce((n, c) => n + c.units, 0);
  const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

  function add() {
    const c = code.trim(), t = title.trim(), u = Number(units);
    if (c.length < 2 || t.length < 2 || !u || u < 1 || u > 12) return;
    if (courses.some((x) => norm(x.code) === norm(c))) return;
    setCourses([...courses, { code: c, title: t, units: u }]);
    setCode(""); setTitle(""); setUnits("3");
  }

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="institutionId" value={institutionId} />
      <input type="hidden" name="campusId" value={campusId} />
      {rollover && <input type="hidden" name="rollover" value="1" />}
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="semester" value={semester} />
      <input type="hidden" name="courses" value={JSON.stringify(courses)} />

      <div className="overflow-hidden rounded-3xl bg-card">
        {courses.map((c, i) => (
          <div key={`${c.code}-${i}`} className="rise flex items-center gap-3 border-b border-ink/10 px-5 py-4 last:border-0" style={{ animationDelay: `${600 + i * 60}ms` }}>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `var(--color-${TOKENS[i % TOKENS.length]})` }} />
            <span className="font-bold text-ink">{c.code}</span>
            <span className="truncate text-sm text-ink/70">{c.title}</span>
            <span className="ml-auto shrink-0 font-mono text-sm text-ink/50">{c.units}u</span>
            {editing && (
              <button type="button" onClick={() => setCourses(courses.filter((_, n) => n !== i))} aria-label={`Remove ${c.code}`} className="shrink-0 text-lg font-bold text-ink/40 hover:text-alarm">&times;</button>
            )}
          </div>
        ))}
        {courses.length === 0 && <p className="px-5 py-6 text-ink/60">No courses yet. Add the ones you are taking.</p>}
      </div>

      {editing && (
        <div className="mt-3 rounded-3xl bg-ink/10 p-4">
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ACC 225" className="w-32 rounded-full bg-card px-4 py-3 font-bold text-ink outline-none" />
            <input value={units} onChange={(e) => setUnits(e.target.value)} inputMode="numeric" className="w-16 rounded-full bg-card px-3 py-3 text-center font-mono text-ink outline-none" />
            <button type="button" onClick={add} className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-bold text-ground">Add</button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Public Sector Accounting" className="mt-2 w-full rounded-full bg-card px-4 py-3 text-ink outline-none" />
        </div>
      )}

      {state?.error && <p className="mt-4 font-bold text-ink">{state.error}</p>}

      <div className="rise mt-8 space-y-3" style={{ animationDelay: `${600 + courses.length * 60 + 120}ms` }}>
        <button type="submit" disabled={pending || courses.length === 0} className="w-full rounded-full bg-card px-8 py-5 text-lg font-bold text-ink transition-opacity disabled:opacity-40">
          {pending ? "Setting up..." : rollover ? "Start this semester" : "Looks right"}
        </button>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="w-full rounded-full border-2 border-cream/60 px-8 py-5 text-lg font-bold text-cream">One of these is wrong</button>
        )}
      </div>

      {courses.length > 0 && <p className="rise mt-4 text-center font-mono text-sm text-ink/60" style={{ animationDelay: `${600 + courses.length * 60 + 180}ms` }}>{courses.length} courses &middot; {totalUnits} units</p>}
    </form>
  );
}
