"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ladderFor } from "@/modules/identity/ladder";
import { awardsFor, modesFor, defaultYears, type Kind } from "@/modules/identity/awards";
import { looksLike } from "@/modules/identity/normalise";
import { declareProgramme } from "./declare-actions";

type Programme = { id: string; name: string; award: string; studyMode: string; years: number };

export function DeclareForm({ programmes: seeded, institutionId, campusId, kind }: { programmes: Programme[]; institutionId: string; campusId: string; kind: Kind }) {
  const router = useRouter();
  const [added, setAdded] = useState<Programme[]>([]);
  const programmes = [...seeded, ...added];

  const [mode, setMode] = useState<string | null>(null);
  const [award, setAward] = useState<string | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [semester, setSemester] = useState<1 | 2 | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Narrow to what is seeded, but never to nothing: an institution or
  // mode we have no programmes for must still offer every valid option,
  // or the student hits a dead end. Applies at each level of the funnel.
  const narrow = <T,>(all: T[], present: (t: T) => boolean) => {
    const some = all.filter(present);
    return some.length > 0 ? some : all;
  };

  const seededModes = new Set(programmes.map((p) => p.studyMode));
  const modes = narrow(modesFor(kind), ([v]) => seededModes.has(v));
  const effectiveMode = modes.length === 1 ? modes[0][0] : mode;

  const inMode = effectiveMode ? programmes.filter((p) => p.studyMode === effectiveMode) : [];
  const awards = narrow(awardsFor(kind), (a) => inMode.some((p) => p.award === a));
  const effectiveAward = awards.length === 1 ? awards[0] : award;
  const inAward = effectiveAward ? inMode.filter((p) => p.award === effectiveAward) : [];

  const term = q.trim();
  const matches = term.length >= 2
    ? inAward.filter((p) => p.name.toLowerCase().includes(term.toLowerCase()) || looksLike(p.name, term)).slice(0, 6)
    : inAward.slice(0, 6);
  const exact = inAward.some((p) => p.name.toLowerCase() === term.toLowerCase());
  const canAdd = term.length >= 3 && !exact && !!effectiveAward && !!effectiveMode;

  const levels = programme ? ladderFor(programme.award, programme.years) : [];

  async function addProgramme() {
    if (!canAdd) return;
    setSaving(true); setError(null);
    const fd = new FormData();
    fd.set("campusId", campusId);
    fd.set("institutionId", institutionId);
    fd.set("name", term);
    fd.set("award", effectiveAward!);
    fd.set("studyMode", effectiveMode!);
    const res = await declareProgramme(null, fd);
    setSaving(false);
    if (res && "error" in res && res.error) { setError(res.error); return; }
    if (res && "programmeId" in res && res.programmeId) {
      const np: Programme = { id: res.programmeId, name: res.name, award: effectiveAward!, studyMode: effectiveMode!, years: defaultYears(effectiveAward!, effectiveMode!) };
      setAdded((a) => [...a, np]);
      setProgramme(np);
      setQ("");
    }
  }

  function go() {
    if (!programme || !level || !semester) return;
    const p = new URLSearchParams({ institution: institutionId, campus: campusId, programme: programme.id, level, semester: String(semester) });
    router.push(`/onboarding/confirm?${p.toString()}`);
  }

  const pill = "flex w-full items-center gap-3 rounded-full px-6 py-4 text-left font-bold transition-transform active:scale-[0.99]";
  const chip = "rounded-full px-5 py-3 text-sm font-bold transition-transform active:scale-[0.99]";
  const on = "bg-ink text-ground";
  // The card surface, not a fixed cream: cream is a light value and ink
  // flips, so the pair collapses in dark mode.
  const off = "bg-card text-ink";
  const label = "label text-ink/60";

  return (
    <div className="mt-8">
      {modes.length > 1 && (
        <>
          <p className={label}>How do you attend?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {modes.map(([v, l]) => (
              <button key={v} type="button" onClick={() => { setMode(v); setAward(null); setProgramme(null); setLevel(null); setSemester(null); setQ(""); }} className={`${chip} ${effectiveMode === v ? on : off}`}>{l}</button>
            ))}
          </div>
        </>
      )}

      {effectiveMode && awards.length > 1 && (
        <>
          <p className={`${label} mt-8`}>Award</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {awards.map((a) => (
              <button key={a} type="button" onClick={() => { setAward(a); setProgramme(null); setLevel(null); setSemester(null); setQ(""); }} className={`${chip} ${effectiveAward === a ? on : off}`}>{a}</button>
            ))}
          </div>
        </>
      )}

      {effectiveMode && effectiveAward && (
        <>
          <p className={`${label} mt-8`}>Programme</p>
          <input value={programme ? programme.name : q} onChange={(e) => { setQ(e.target.value); setProgramme(null); setLevel(null); setSemester(null); }} placeholder="Start typing your programme" autoComplete="off" className="mt-2 w-full rounded-full border-2 border-ink/30 bg-transparent px-6 py-4 font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink/40 focus:border-ink" />

          {programmes.length === 0 && !term && (
            <p className="mt-2 text-sm text-muted">
              Yours will be the first from this school. Type it in and it will
              be here for whoever comes next.
            </p>
          )}

          {!programme && (
            <div className="mt-2 space-y-2">
              {matches.map((p) => (
                <button key={p.id} type="button" onClick={() => { setProgramme(p); setQ(p.name); }} className={`${pill} ${off}`}>
                  <span>{p.name}</span>
                </button>
              ))}

              {canAdd && (
                <button type="button" onClick={addProgramme} disabled={saving} className="w-full rounded-full border-2 border-dashed border-ink/40 px-6 py-4 text-left text-ink/80 disabled:opacity-50">
                  {saving ? "Adding..." : `Add "${term}" as my programme`}
                </button>
              )}

              {term.length >= 2 && matches.length === 0 && !canAdd && (
                <p className="px-2 py-3 text-sm text-ink/70">Nothing matching. Keep typing to add yours.</p>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-sm font-bold text-ink">{error}</p>}
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
            <button type="button" onClick={() => setSemester(1)} className={`flex-1 rounded-full px-4 py-4 font-bold ${semester === 1 ? on : off}`}>First</button>
            <button type="button" onClick={() => setSemester(2)} className={`flex-1 rounded-full px-4 py-4 font-bold ${semester === 2 ? on : off}`}>Second</button>
          </div>
        </>
      )}

      <button type="button" onClick={go} disabled={!programme || !level || !semester} className="mt-10 w-full rounded-full bg-ink px-8 py-5 text-lg font-bold text-ground transition-opacity disabled:opacity-30">That is me &rarr;</button>
      <p className="mt-3 text-center text-sm text-ink/60">You can change this later.</p>
    </div>
  );
}
