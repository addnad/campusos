import { Mark } from "@/components/ui/mark";

/// The mark over whatever is loading. Fades in after a moment, so a page
/// that arrives quickly does not flash the logo for a split second.
export function LoadingMark() {
  return (
    <div className="loading-mark pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden>
      <div className="rounded-3xl bg-ground/80 p-5 backdrop-blur-sm">
        <Mark size={56} blink="thinking" />
      </div>
    </div>
  );
}
