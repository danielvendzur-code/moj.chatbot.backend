import { animate, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Step entrances, chip staggers and message arrivals are CSS animations now, so
   they live inside `@media (prefers-reduced-motion: no-preference)` and cannot
   run at all for people who asked for stillness. Only the one-off check stroke,
   which needs SVG path measurement, still runs in script. */

/* The success check is drawn once; the static icon remains a safe fallback. */
export function drawCheck(scope: HTMLElement | null): void {
  if (!scope) return;
  const path = scope.querySelector("path");
  if (!path || prefersReducedMotion()) return;
  try {
    const [drawable] = svg.createDrawable(path);
    if (!drawable) return;
    animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: 520,
      delay: 120,
      ease: "inOutQuad",
    });
  } catch {
    /* Drawing is enhancement only; the icon remains visible without it. */
  }
}
