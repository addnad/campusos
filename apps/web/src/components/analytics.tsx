"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/// Ties the browser's own events (pageviews, sessions) to the same person
/// the server records against, by identifying with the user id. Rendered
/// in the root layout: signed out, userId is null and the visitor stays
/// anonymous.
export function Analytics({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    if (userId) {
      posthog.identify(userId);
    } else if (posthog._isIdentified()) {
      // Only on an actual sign out, so the next person on the device does
      // not inherit this identity. Resetting an already-anonymous visitor
      // would mint a new id on every page load and split their session.
      posthog.reset();
    }
  }, [userId]);
  return null;
}
