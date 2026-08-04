"use client";

import { useRef } from "react";

/// Press and hold on touch, right-click on desktop. Cancels if the
/// finger moves, so a scroll does not open the sheet.
export function useLongPress(onTrigger: () => void, ms = 450) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  return {
    onTouchStart: () => {
      moved.current = false;
      timer.current = setTimeout(() => { if (!moved.current) onTrigger(); }, ms);
    },
    onTouchMove: () => { moved.current = true; clear(); },
    onTouchEnd: clear,
    onTouchCancel: clear,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); onTrigger(); },
    // Desktop: hold the mouse down too, so testing does not depend on
    // right-click reaching the handler before the browser menu.
    onMouseDown: () => {
      moved.current = false;
      timer.current = setTimeout(() => { if (!moved.current) onTrigger(); }, ms);
    },
    onMouseMove: () => { moved.current = true; clear(); },
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}
