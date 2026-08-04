"use client";

import { useState, useTransition } from "react";
import { setSemesterEnd, setNextSemester, dontKnowSemesterEnd, dismissSemesterPrompt } from "./semester-actions";
import type { Prompt } from "@/modules/academics/semester";

const field = "w-full rounded-full bg-card px-5 py-3 text-ink outline-none";

export function SemesterPrompt({ prompt }: { prompt: Prompt }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  const [date, setDate] = useState("");

  if (!prompt || gone) return null;

  const isEnd = prompt.kind === "end-date";

  return (
    <section className="mt-8 rounded-3xl bg-sunken p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-lg uppercase leading-tight text-ink">
          {isEnd ? "When does this semester end?" : "When does next semester start?"}
        </p>
        <button type="button" onClick={() => { setGone(true); start(() => dismissSemesterPrompt().then(() => undefined)); }} aria-label="Not now" className="shrink-0 text-xl leading-none text-muted hover:text-ink">&times;</button>
      </div>

      <p className="mt-1 text-sm text-muted">
        {isEnd
          ? "So we can tell you when to get ready for the next one. You can change it if it moves."
          : "We will set your courses up before it starts, not after."}
      </p>

      <form
        className="mt-4"
        action={(fd) => start(async () => {
          const res = isEnd ? await setSemesterEnd(fd) : await setNextSemester(fd);
          if (res && "ok" in res) setGone(true);
        })}
      >
        <input type="date" name={isEnd ? "endsAt" : "startsAt"} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" disabled={pending || !date} className="rounded-full bg-ink px-6 py-3 font-bold text-ground disabled:opacity-30">
            {pending ? "Saving..." : "Save"}
          </button>
          {isEnd && (
            <button type="button" disabled={pending} onClick={() => { setGone(true); start(() => dontKnowSemesterEnd().then(() => undefined)); }} className="rounded-full px-6 py-3 font-bold text-muted hover:text-ink">
              I do not know yet
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
