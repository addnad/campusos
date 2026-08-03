"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/// Re-render when the student comes back to the tab. Grouping changes as
/// classes end — a finished class belongs under "Earlier today" — and
/// that needs the server, unlike the relative times. Polling would cost
/// a student data for nothing; the moment they look is the moment it
/// matters.
export function RefreshOnReturn({ staleAfterMs = 60000 }: { staleAfterMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let left = Date.now();

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        left = Date.now();
        return;
      }
      if (Date.now() - left > staleAfterMs) router.refresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [router, staleAfterMs]);

  return null;
}
