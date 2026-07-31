"use client";

import { useActionState, useEffect, useState } from "react";
import { claimHandle } from "./actions";

type Status = { available: boolean; reason: string | null } | null;

export function HandleForm({ suggestions }: { suggestions: string[] }) {
  const [state, action, pending] = useActionState(claimHandle, null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (value.trim().length < 3) {
      setStatus(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/handle/check?h=${encodeURIComponent(value)}`);
        setStatus(await res.json());
      } catch {
        setStatus(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <form action={action} className="mt-8">
      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-card px-4 py-3">
        <span className="font-display text-xl text-ink/40">@</span>
        <input
          name="handle"
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="yourhandle"
          className="w-full bg-transparent text-lg font-bold text-ink outline-none placeholder:text-ink/30"
        />
      </div>

      <p className="mt-2 min-h-6 text-sm">
        {checking && <span className="text-muted">Checking...</span>}
        {!checking && status?.available && (
          <span className="font-bold text-mint">Available</span>
        )}
        {!checking && status && !status.available && (
          <span className="font-bold text-alarm">{status.reason}</span>
        )}
        {!checking && !status && (
          <span className="text-muted">3-20 characters. Letters, numbers, underscores.</span>
        )}
      </p>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full border-2 border-ink/20 px-4 py-2 text-sm font-bold text-ink hover:border-ink"
            >
              @{s}
            </button>
          ))}
        </div>
      )}

      {state?.error && (
        <p className="mt-4 text-sm font-bold text-alarm">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !status?.available}
        className="mt-8 w-full rounded-full bg-ink px-8 py-4 text-lg font-bold text-ground transition-opacity hover:opacity-80 disabled:opacity-30"
      >
        {pending ? "Claiming..." : "Claim handle"}
      </button>

      <p className="mt-4 text-sm text-muted">
        You can change this once a year.
      </p>
    </form>
  );
}
