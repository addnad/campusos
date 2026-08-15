"use client";

import { useActionState, useState } from "react";
import { changeHandle } from "./handle-actions";

export function ChangeHandle({ handle, lastChanged }: { handle: string; lastChanged: string | null }) {
  const [state, action, pending] = useActionState(changeHandle, null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const locked = lastChanged
    ? Date.now() - new Date(lastChanged).getTime() < 90 * 86400000
    : false;

  if (state && "ok" in state && state.ok) {
    return <p className="mt-2 text-sm text-muted">Now @{state.handle}.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-bold text-muted underline underline-offset-4 hover:text-ink">
        Change my handle
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 rounded-2xl bg-sunken p-4">
      <p className="label text-muted">New handle</p>
      <input
        name="handle"
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        autoComplete="off"
        placeholder={handle}
        className="mt-2 w-full rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:text-muted"
      />

      <p className="mt-2 text-sm text-muted">
        {locked
          ? "You have changed it in the last three months."
          : "Once every three months. Coursemates know you by this in every room you are in."}
      </p>

      {state && "error" in state && state.error && (
        <p className="mt-2 text-sm font-bold text-alarm">{state.error}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending || locked || value.length < 3} className="rounded-full bg-ink px-5 py-3 font-bold text-ground disabled:opacity-30">
          {pending ? "Saving..." : "Change it"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-3 font-bold text-muted">Cancel</button>
      </div>
    </form>
  );
}
