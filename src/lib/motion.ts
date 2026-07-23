import { animate, createSpring, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Builder choices use a short, quiet entrance without spring or sideways movement. */
export function animateStepIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  if (container.dataset.cwStepAnimated === "true") return;
  container.dataset.cwStepAnimated = "true";
  const targets = Array.from(
    container.querySelectorAll(
      ".cw-rows > *:not(.cw-glide), .cw-grid > *:not(.cw-glide), .cw-list > *:not(.cw-glide), .cw-summary, .cw-lead, .cw-industry-tip, .cw-custom",
    ),
  ) as HTMLElement[];
  if (targets.length === 0) return;
  targets.forEach((target, index) => {
    target.animate(
      [
        { opacity: 0, translate: "0 5px", scale: "0.99" },
        { opacity: 1, translate: "0 0", scale: "1" },
      ],
      {
        delay: 20 + index * 18,
        duration: 260,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      },
    );
  });
}

/* Quick choices arrive quietly; no springy scale or scattered motion. */
export function animateChipsIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  if (container.dataset.cwChipsAnimated === "true") return;
  container.dataset.cwChipsAnimated = "true";
  const targets = Array.from(container.querySelectorAll(":scope > .cw-chip")) as HTMLElement[];
  if (targets.length === 0) return;
  targets.forEach((target, index) => {
    target.animate(
      [
        { opacity: 0, translate: "0 6px", scale: "0.98" },
        { opacity: 1, translate: "0 0", scale: "1" },
      ],
      {
        delay: 70 + index * 45,
        duration: 320,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      },
    );
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
