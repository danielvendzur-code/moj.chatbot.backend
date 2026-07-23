import { animate, stagger, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Builder choices use a short, quiet entrance without spring or sideways movement. */
export function animateStepIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(
    container.querySelectorAll(
      ".cw-rows > *:not(.cw-glide), .cw-grid > *:not(.cw-glide), .cw-list > *:not(.cw-glide), .cw-summary, .cw-lead, .cw-industry-tip, .cw-custom",
    ),
  ) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [4, 0],
    delay: stagger(16, { start: 18 }),
    duration: 230,
    ease: "outCubic",
  });
}

/* Quick choices arrive together and remain visually anchored above the input. */
export function animateChipsIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(container.querySelectorAll(":scope > .cw-chip")) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [4, 0],
    delay: stagger(24, { start: 35 }),
    duration: 230,
    ease: "outCubic",
  });
}

/* Sent messages move only a few pixels from the composer; no rotation or spring shake. */
export function animateSentMessage(row: HTMLElement | null): void {
  if (!row || prefersReducedMotion()) return;
  animate(row, {
    opacity: [0, 1],
    translateY: [8, 0],
    translateX: [4, 0],
    duration: 260,
    ease: "outCubic",
  });
}

/* Fajka na poďakovaní sa nakreslí ťahom. */
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
    /* Kreslenie je len doplnok; bez neho zostane fajka statická. */
  }
}
