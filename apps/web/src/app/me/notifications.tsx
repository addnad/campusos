"use client";

import { useEffect, useState, useTransition } from "react";
import { saveSubscription, removeSubscription, setPrefs } from "./push-actions";

type Prefs = { classes: boolean; deadlines: boolean; mentions: boolean; roomActivity: boolean };

const ROWS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "classes", label: "Classes", hint: "Before a class starts" },
  { key: "deadlines", label: "Deadlines", hint: "Due today or tomorrow" },
  { key: "mentions", label: "Mentions", hint: "When someone names you in a room" },
  { key: "roomActivity", label: "Room activity", hint: "Every message in your rooms" },
];

/// The base64url VAPID key has to reach the browser as bytes.
function toBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function Notifications({ initial }: { initial: Prefs }) {
  const [prefs, setLocal] = useState(initial);
  const [state, setState] = useState<"unknown" | "off" | "on" | "blocked">("unknown");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "denied") { setState("blocked"); return; }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    });
  }, []);

  async function enable() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setState("blocked"); return; }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
    });
    await saveSubscription(JSON.parse(JSON.stringify(sub)));
    setState("on");
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removeSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  }

  function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setLocal(next);
    start(async () => { await setPrefs(next); });
  }

  return (
    <section className="mt-10">
      <p className="label text-muted">Notifications</p>

      {state === "blocked" && (
        <p className="mt-2 text-sm text-muted">
          Turned off in your browser settings. You would need to allow them there
          first.
        </p>
      )}

      {state === "off" && (
        <button type="button" onClick={enable} className="mt-2 rounded-full bg-ink px-6 py-3 font-bold text-ground">
          Turn on notifications
        </button>
      )}

      {state === "on" && (
        <>
          <ul className="mt-2 space-y-1">
            {ROWS.map((r) => (
              <li key={r.key}>
                <button type="button" onClick={() => toggle(r.key)} disabled={pending} className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-ink">{r.label}</span>
                    <span className="block text-sm text-muted">{r.hint}</span>
                  </span>
                  <span className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${prefs[r.key] ? "bg-ink" : "bg-card"}`}>
                    <span className={`block h-5 w-5 rounded-full bg-ground transition-transform ${prefs[r.key] ? "translate-x-5" : ""}`} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={disable} className="mt-3 text-sm font-bold text-muted underline underline-offset-4">
            Turn off on this device
          </button>
        </>
      )}
    </section>
  );
}
