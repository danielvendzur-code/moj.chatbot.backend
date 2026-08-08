import { useEffect } from "react";

const tabButtonFromPoint = (event: PointerEvent): HTMLElement | null => {
  const direct =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(".cw-tabs > button")
      : null;
  if (direct) return direct;

  const pointed = document.elementFromPoint(event.clientX, event.clientY);
  return pointed?.closest<HTMLElement>(".cw-tabs > button") ?? null;
};

/**
 * Keeps ordinary Chatbot/Konfigurátor taps authoritative even when an older
 * swipe rail temporarily captures the pointer. Releasing capture is the normal
 * path; the pointer-up fallback covers browsers where the eventual click would
 * otherwise be retargeted to the tab rail instead of the button under it.
 */
export function LaunchReadyRuntime(): null {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const button = tabButtonFromPoint(event);
      if (!button) return;
      const tabs = button.closest<HTMLElement>(".cw-tabs");
      if (!tabs) return;
      const pointerId = event.pointerId;

      queueMicrotask(() => {
        try {
          if (tabs.hasPointerCapture(pointerId)) tabs.releasePointerCapture(pointerId);
        } catch {
          // Pointer capture is optional; pointer-up fallback remains available.
        }
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const button = tabButtonFromPoint(event);
      if (!button) return;

      const directTarget =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(".cw-tabs > button")
          : null;
      if (directTarget === button) return;

      queueMicrotask(() => button.click());
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
    };
  }, []);

  return null;
}
