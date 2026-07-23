const SELECTOR = ".cw-spotlight";

export function installWidgetSpotlight(): () => void {
  if (
    typeof window === "undefined" ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return () => undefined;
  }

  let active: HTMLElement | null = null;
  let frame = 0;
  let clientX = 0;
  let clientY = 0;

  const clear = () => {
    if (!active) return;
    active.removeAttribute("data-cw-spotlight");
    active.style.removeProperty("--cw-spot-x");
    active.style.removeProperty("--cw-spot-y");
    active = null;
  };

  const paint = () => {
    frame = 0;
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / Math.max(rect.width, 1)) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / Math.max(rect.height, 1)) * 100));
    active.style.setProperty("--cw-spot-x", `${x}%`);
    active.style.setProperty("--cw-spot-y", `${y}%`);
    active.dataset.cwSpotlight = "true";
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const next =
      event.target instanceof Element ? event.target.closest<HTMLElement>(SELECTOR) : null;
    if (next !== active) {
      clear();
      active = next;
    }
    if (!active) return;
    clientX = event.clientX;
    clientY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paint);
  };

  const onPointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) clear();
  };

  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });
  document.addEventListener("pointerout", onPointerOut, { capture: true, passive: true });
  window.addEventListener("blur", clear);

  return () => {
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerout", onPointerOut, true);
    window.removeEventListener("blur", clear);
    if (frame) window.cancelAnimationFrame(frame);
    clear();
  };
}
