"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ladderFor } from "@/modules/identity/ladder";

/// Level is asked, not inferred: moving from second semester to first is
/// a new academic year for most students, but someone repeating the year
/// stays where they are, and telling them otherwise cascades into the
/// wrong prefill and the wrong community.
export function RollOver({ startsAt, currentLevel, currentSemester, award, years, programmeId, institutionId, campusId }: {
  startsAt: Date; currentLevel: string; currentSemester: number;
  award: string; years: number;
  programmeId: string; institutionId: string; campusId: string;
}) {
  const router = useRouter();
  const nextSemester = currentSemester === 1 ? 2 : 1;
  const newYear = currentSemester === 2;

  const ladder = ladderFor(award, years);
  const i = ladder.indexOf(currentLevel);
  const nextLevel = newYear && i >= 0 && i < ladder.length - 1 ? ladder[i + 1] : currentLevel;

  const [level, setLevel] = useState(nextLevel);

  function go() {
    const p = new URLSearchParams({
      institution: institutionId, campus: campusId, programme: programmeId,
      level, semester: String(nextSemester), rollover: "1",
    });
    router.push(`/onboarding/confirm?${p.toString()}`);
  }

  const days = Math.ceil((startsAt.getTime() - Date.now()) / 86400000);
  const chip = "rounded-full px-5 py-3 text-sm font-bold transition-transform active:scale-[0.99]";

  return (
    <section className="mt-8 rounded-3xl bg-ink p-6">
      <p className="label text-ground/60">
        {days <= 0 ? "Starting now" : days === 1 ? "Starts tomorrow" : `Starts in ${days} days`}
      </p>
      <p className="mt-2 font-display text-2xl uppercase leading-tight text-ground">
        {nextSemester === 1 ? "First" : "Second"} semester
      </p>
      <p className="mt-2 text-ground/70">
        Set your courses up now and your timetable is ready before the first
        lecture, not after it.
      </p>

      {newYear && nextLevel !== currentLevel && (
        <>
          <p className="mt-5 label text-ground/60">Which level?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setLevel(nextLevel)} className={`${chip} ${level === nextLevel ? "bg-ground text-ink" : "bg-ground/15 text-ground"}`}>{nextLevel}</button>
            <button type="button" onClick={() => setLevel(currentLevel)} className={`${chip} ${level === currentLevel ? "bg-ground text-ink" : "bg-ground/15 text-ground"}`}>Repeating {currentLevel}</button>
          </div>
        </>
      )}

      <button type="button" onClick={go} className="mt-6 w-full rounded-full bg-ground px-6 py-4 font-bold text-ink">
        Set up {level} &rarr;
      </button>
    </section>
  );
}
