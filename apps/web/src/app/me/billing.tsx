"use client";

import { useTransition, useState } from "react";
import { buySemester } from "./billing-actions";

export function Billing({ paidUntil }: { paidUntil: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const active = paidUntil && new Date(paidUntil) > new Date();

  if (active) {
    return (
      <section className="mt-10">
        <p className="label text-muted">Tutor</p>
        <p className="mt-2 font-bold text-ink">25 questions and 10 decks a day</p>
        <p className="mt-1 text-sm text-muted">
          Until {new Date(paidUntil!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <p className="label text-muted">Tutor</p>
      <p className="mt-2 text-ink">
        Three questions and two decks a day, free. For a semester of{" "}
        <span className="font-bold">25 questions and 10 decks a day</span>, it is
        &#8358;2,000.
      </p>

      {error && <p className="mt-3 text-sm font-bold text-alarm">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await buySemester();
          if (res && "error" in res && res.error) setError(res.error);
        })}
        className="mt-4 rounded-full bg-ink px-6 py-3 font-bold text-ground disabled:opacity-40"
      >
        {pending ? "Opening..." : "Pay \u20a62,000 for the semester"}
      </button>
    </section>
  );
}
