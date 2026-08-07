"use client";

import { useState, useTransition } from "react";
import { deleteAccount, signOutAfterDelete } from "./delete-actions";

/// Two steps and a typed handle. Deletion cannot be undone, and a
/// mistap should not be able to reach it.
export function DeleteAccount({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-6 text-sm font-bold text-muted underline underline-offset-4 hover:text-alarm">
        Delete my account
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border-2 border-alarm/40 p-5">
      <p className="font-display text-lg uppercase leading-tight text-ink">
        Delete your account
      </p>

      <p className="mt-2 text-sm text-muted">
        Your courses, notes, cards and tutor history go immediately and cannot
        be recovered. Messages you posted in rooms stay, shown as coming from a
        deleted account &mdash; a conversation with half of it removed is not a
        conversation. Your handle is held for three months before anyone else
        can take it.
      </p>

      <label className="mt-4 block">
        <span className="label text-muted">Type @{handle} to confirm</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          placeholder={handle}
          className="mt-1 w-full rounded-2xl bg-card px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
      </label>

      {error && <p className="mt-3 text-sm font-bold text-alarm">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || typed.trim().toLowerCase() !== handle.toLowerCase()}
          onClick={() => start(async () => {
            const res = await deleteAccount(typed);
            if (res && "error" in res && res.error) { setError(res.error); return; }
            await signOutAfterDelete();
          })}
          className="rounded-full bg-alarm px-6 py-3 font-bold text-ground disabled:opacity-30"
        >
          {pending ? "Deleting..." : "Delete permanently"}
        </button>

        <button type="button" onClick={() => { setOpen(false); setTyped(""); setError(null); }} className="rounded-full px-6 py-3 font-bold text-muted">
          Keep my account
        </button>
      </div>
    </div>
  );
}
