import { useEffect } from "react";

/** Keeps ordinary Chatbot/Konfigurátor button taps from being swallowed by
 * the swipe rail's pointer capture while preserving drag-to-switch on the rail. */
export function LaunchReadyRuntime(): null {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLElement>(".cw-tabs > button");
      if (!button) return;
      const tabs = button.closest<HTMLElement>(".cw-tabs");
      if (!tabs) return;
      const pointerId = event.pointerId;
      queueMicrotask(() => {
        try {
          if (tabs.hasPointerCapture(pointerId)) tabs.releasePointerCapture(pointerId);
        } catch {
          // Pointer capture is optional; button click stays available.
        }
      });
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}
