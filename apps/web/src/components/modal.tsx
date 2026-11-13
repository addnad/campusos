"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/// Closing goes back rather than to a fixed page, so the URL and the
/// back button stay in step with what is on screen.
export function Modal({ children, label }: { children: React.ReactNode; label: string }) {
  const router = useRouter();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") router.back(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6"
      onClick={() => router.back()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-ground px-6 pb-10 pt-14 sm:rounded-3xl"
      >
        <button
          ref={close}
          type="button"
          onClick={() => router.back()}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-xl font-bold text-ink"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
