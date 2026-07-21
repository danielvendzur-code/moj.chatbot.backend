import { animate, createSpring, stagger, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SPRING = createSpring({ mass: 1, stiffness: 190, damping: 16, velocity: 0 });

/* Kroky sa zobrazia pokojne zdola. Bez bočného presunu a bez prehnaného pruženia. */
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
    translateY: [8, 0],
    scale: [0.99, 1],
    delay: stagger(32, { start: 20 }),
    duration: 380,
    ease: "outCubic",
  });
}

/* Chipy vyskočia po jednom. */
export function animateChipsIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(container.querySelectorAll(":scope > .cw-chip")) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [10, 0],
    scale: [0.7, 1],
    delay: stagger(70, { start: 120 }),
    duration: 640,
    ease: SPRING,
  });
}

/* Odoslaná správa priletí od vstupného poľa ako papierové lietadlo. */
export function animateSentMessage(row: HTMLElement | null): void {
  if (!row) return;
  if (prefersReducedMotion()) return;
  animate(row, {
    opacity: [0, 1],
    translateY: [64, 0],
    translateX: [36, 0],
    rotate: ["-7deg", "0deg"],
    scale: [0.82, 1],
    duration: 680,
    ease: createSpring({ mass: 1, stiffness: 170, damping: 15, velocity: 0 }),
  });
}

/* Fajka na poďakovaní sa nakreslí ťahom (anime.js createDrawable). */
export function drawCheck(scope: HTMLElement | null): void {
  if (!scope) return;
  const path = scope.querySelector("path");
  if (!path) return;
  if (prefersReducedMotion()) return;
  try {
    const [drawable] = svg.createDrawable(path);
    if (!drawable) return;
    animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: 700,
      delay: 240,
      ease: "inOutQuad",
    });
  } catch {
    /* kreslenie je len ozdoba — bez nej sa fajka zobrazí normálne */
  }
}
