"use client";

import { useEffect, useState } from "react";

/// A clock that ticks, so "in 51 min" does not stay at 51 minutes while
/// a student leaves the tab open between lectures. Local only — no
/// server call, nothing fetched.
export function useNow(seed: string, everyMs = 30000) {
  const [now, setNow] = useState(() => new Date(seed));

  useEffect(() => {
    // Correct immediately: the seed came from the server render, which
    // may be minutes old by the time this mounts.
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);

  return now;
}
