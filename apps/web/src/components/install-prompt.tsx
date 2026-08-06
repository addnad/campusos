"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "campusos-install-dismissed";

/// Shown after onboarding, not on arrival: a student who has just set up
/// their courses has a reason to keep the app. One who has seen nothing
/// yet does not.
///
/// On iOS there is no install API at all — only instructions — and
/// installing is the precondition for push, so it matters more there.
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED)) return;

    // Already installed: nothing to offer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari) {
      setIos(true);
      setShow(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <section className="mt-8 rounded-3xl bg-sunken p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-lg uppercase leading-tight text-ink">
          Keep CampusOS on your phone
        </p>
        <button type="button" onClick={dismiss} aria-label="Not now" className="shrink-0 text-xl leading-none text-muted hover:text-ink">
          &times;
        </button>
      </div>

      {ios ? (
        <p className="mt-2 text-sm text-muted">
          Tap <span className="font-bold text-ink">Share</span>, then{" "}
          <span className="font-bold text-ink">Add to Home Screen</span>. It opens
          straight to your day, and it is how reminders reach you.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            It opens straight to your day, and works from your home screen like
            any other app.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!event) return;
              await event.prompt();
              const { outcome } = await event.userChoice;
              if (outcome === "accepted") setShow(false);
              else dismiss();
            }}
            className="mt-4 rounded-full bg-ink px-6 py-3 font-bold text-ground"
          >
            Add to home screen
          </button>
        </>
      )}
    </section>
  );
}
