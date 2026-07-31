"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ladderFor } from "@/modules/identity/ladder";

type Mode = "FULL_TIME" | "PART_TIME_WEEKDAY" | "PART_TIME_WEEKEND" | "SANDWICH" | "DISTANCE";
type Programme = { id: string; name: string; award: string; studyMode: Mode; years: number };

const MODE_LABEL: Record<Mode, string> = {
  FULL_TIME: "Full time",
  PART_TIME_WEEKDAY: "Part time (weekday)",
  PART_TIME_WEEKEND: "Part time (weekend)",
  SANDWICH: "Sandwich",
  DISTANCE: "Distance",
};

export function DeclareForm({ programmes, institutionId, campusId }: { programmes: Programme[]; institutionId: string; campusId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [semester, setSemester] = useState<1 | 2 | null>(null);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);

  const modes = [...new Set(programmes.map((p) => p.studyMode))] as Mode[];
  const effectiveMode = modes.length === 1 ? modes[0] : mode;

  const inMode = effectiveMode ? programmes.filter((p) => p.studyMode === effectiveMode) : [];
  const term = q.trim().toLowerCase();
  const shown = searching && term ? inMode.filter((p) => p.name.toLowerCase().includes(term)) : inMode.slice(0, 6);

  // The ladder is a property of the programme: full-time ND runs two
  // years, part-time ND runs three.
  const levels = programme ? ladderFor(programme.award, programme.years) : [];

  function pickMode(m: Mode) {
    setMode(m); setProgramme(null); setLevel(null); setSemester(null); setSearching(false); setQ("");
  }
  function pickProgramme(p: Programme) {
    setProgramme(p); setLevel(null); setSemester(null);
  }

  function go() {
    if (!programme || !level || !semester) return;
    const params = new URLSearchParams({ institution: institutionId, campus: campusId, programme: programme.id, level, semester: String(semester) });
    router.push(`/onboarding/confirm?${params.toString()}`);
  }

  const pill = "flex w-full items-center gap-3 rounded-full px-6 py-4 text-left font-bold transition-transform active:scale-[0.99]";
  const on = "bg-ink text-ground";
  const off = "bg-cream text-ink";
  const label = "font-mono text-xs uppercase tracking-widest text-ink/60";

  return (
    <div className="mt-8">
      {modes.length > 1 && (
        <>
          <p className={label}>How do you attend?</p>
          <div className="mt-2 space-y-2">
            {modes.map((m) => (
              <button key={m} type="button" onClick={() => pickMode(m)} className={`${pill} ${effectiveMode === m ? on : off}`}>
                <span>{MODE_LABEL[m]}</span>
                {effectiveMode === m && <span className="ml-auto text-lg">&#10003;</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {effectiveMode && (
        <>
          <p className={`${label} ${modes.length > 1 ? "mt-8" : ""}`}>Programme</p>
          <div className="mt-2 space-y-2">
            {shown.map((p) => (
              <button key={p.id} type="button" onClick={() => pickProgramme(p)} className={`${pill} ${programme?.id === p.id ? on : off}`}>
                <span>{p.name}</span>
                {programme?.id === p.id && <span className="ml-auto text-lg">&#10003;</span>}
              </button>
            ))}
            {inMode.length === 0 && <p className="rounded-2xl bg-ink/10 px-5 py-4 text-ink/80">No programmes here yet.</p>}
          </div>

          {inMode.length > 6 && !searching && (
            <button type="button" onClick={() => setSearching(true)} className="mt-2 w-full rounded-full border-2 border-dashed border-ink/40 px-6 py-4 text-left text-ink/70">Search all {inMode.length} programmes</button>
          )}
          {searching && (
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programmes" className="mt-2 w-full rounded-full border-2 border-ink/30 bg-transparent px-6 py-4 text-ink outline-none placeholder:text-ink/40 focus:border-ink" />
          )}
        </>
      )}

      {programme && (
        <>
          <p className={`${label} mt-8`}>Level</p>
          <div className="mt-2 space-y-2">
            {levels.map((l) => (
              <button key={l} type="button" onClick={() => { setLevel(l); setSemester(null); }} className={`${pill} ${level === l ? on : off}`}>
                <span>{l}</span>
                {level === l && <span className="ml-auto text-lg">&#10003;</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {programme && level && (
        <>
          <p className={`${label} mt-8`}>Semester</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setSemester(1)} className={`flex-1 rounded-full px-4 py-4 font-bold transition-transform active:scale-[0.99] ${semester === 1 ? on : off}`}>First</button>
            <button type="button" onClick={() => setSemester(2)} className={`flex-1 rounded-full px-4 py-4 font-bold transition-transform active:scale-[0.99] ${semester === 2 ? on : off}`}>Second</button>
          </div>
        </>
      )}

      <button type="button" onClick={go} disabled={!programme || !level || !semester} className="mt-10 w-full rounded-full bg-ink px-8 py-5 text-lg font-bold text-ground transition-opacity disabled:opacity-30">That is me &rarr;</button>
      <p className="mt-3 text-center text-sm text-ink/60">You can change this later.</p>
    </div>
  );
}
