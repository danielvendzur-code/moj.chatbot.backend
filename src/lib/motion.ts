import { animate, createSpring, stagger, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SPRING = createSpring({ mass: 1, stiffness: 190, damping: 16, velocity: 0 });

/* Karty kroku nabehnú postupne s pružinou (inšpirované anime.js stagger grid demami). */
export function animateStepIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(
    container.querySelectorAll(
      ".cw-rows > *, .cw-grid > *, .cw-list > *, .cw-summary, .cw-lead, .cw-industry-tip, .cw-custom",
    ),
  ) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [16, 0],
    scale: [0.985, 1],
    delay: stagger(55, { start: 40 }),
    duration: 620,
    ease: SPRING,
  });
}

/* Chipy vyskočia po jednom. */
export function animateChipsIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(container.children) as HTMLElement[];
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
