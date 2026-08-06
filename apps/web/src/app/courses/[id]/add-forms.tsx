"use client";

import { useActionState, useState } from "react";
import { addClassSession, addAssessment } from "./actions";

const DAYS = [["1","Mon"],["2","Tue"],["3","Wed"],["4","Thu"],["5","Fri"],["6","Sat"],["7","Sun"]] as const;
const KINDS = [["ASSIGNMENT","Assignment"],["TEST","Test"],["EXAM","Exam"],["PROJECT","Project"],["PRESENTATION","Presentation"]] as const;

const field = "w-full rounded-full bg-sunken px-4 py-3 text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-ink";
const chip = "rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-[0.98]";

export function AddClass({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(addClassSession, null);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("1");

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-2xl border-2 border-dashed border-ink/25 px-5 py-4 text-left text-muted hover:border-ink/50">Add a class time</button>;
  }

  return (
    <form action={action} className="mt-3 rounded-2xl bg-card p-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="weekday" value={day} />
      <div className="flex flex-wrap gap-2">
        {DAYS.map(([v, l]) => (
          <button key={v} type="button" onClick={() => setDay(v)} className={`${chip} ${day === v ? "bg-ink text-ground" : "bg-sunken text-ink"}`}>{l}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <label className="flex-1">
          <span className="mb-1 block label text-muted">Starts</span>
          <input name="startsAt" type="time" defaultValue="08:00" step={300} className={field} />
        </label>
        <label className="flex-1">
          <span className="mb-1 block label text-muted">Ends</span>
          <input name="endsAt" type="time" defaultValue="10:00" step={300} className={field} />
        </label>
      </div>
      <input name="venue" placeholder="Venue, e.g. LT 4" className={`${field} mt-2`} />
      <input name="lecturer" placeholder="Lecturer (optional)" className={`${field} mt-2`} />
      {state && "error" in state && state.error && <p className="mt-2 text-sm font-bold text-alarm">{state.error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={pending} className="flex-1 rounded-full bg-ink px-5 py-3 font-bold text-ground disabled:opacity-40">{pending ? "Adding..." : "Add class"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-3 font-bold text-muted">Cancel</button>
      </div>
    </form>
  );
}

export function AddAssessment({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(addAssessment, null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("ASSIGNMENT");

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-2xl border-2 border-dashed border-ink/25 px-5 py-4 text-left text-muted hover:border-ink/50">Add an assignment or test</button>;
  }

  return (
    <form action={action} className="mt-3 rounded-2xl bg-card p-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-wrap gap-2">
        {KINDS.map(([v, l]) => (
          <button key={v} type="button" onClick={() => setKind(v)} className={`${chip} ${kind === v ? "bg-ink text-ground" : "bg-sunken text-ink"}`}>{l}</button>
        ))}
      </div>
      <input name="title" placeholder="What is it?" className={`${field} mt-3`} />
      <div className="mt-2 flex gap-2">
        <input name="date" type="date" className={field} />
        <input name="time" type="time" defaultValue="23:59" className={field} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="isPrivate" className="h-4 w-4 accent-current" />
        Only for me &mdash; do not share with coursemates
      </label>
      {state && "error" in state && state.error && <p className="mt-2 text-sm font-bold text-alarm">{state.error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={pending} className="flex-1 rounded-full bg-ink px-5 py-3 font-bold text-ground disabled:opacity-40">{pending ? "Adding..." : "Add"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-3 font-bold text-muted">Cancel</button>
      </div>
    </form>
  );
}
