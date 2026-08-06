"use client";

import { useEffect, useState } from "react";

/// The count climbs rather than appearing: this is the one moment the
/// app does something for the student, and it should read as a reveal
/// rather than a list arriving.
export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (to <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }

    let current = 0;
    const step = Math.max(1, Math.round(to / 8));
    const t = setInterval(() => {
      current = Math.min(to, current + step);
      setN(current);
      if (current >= to) clearInterval(t);
    }, 70);
    return () => clearInterval(t);
  }, [to]);

  return <span suppressHydrationWarning>{n}</span>;
}
