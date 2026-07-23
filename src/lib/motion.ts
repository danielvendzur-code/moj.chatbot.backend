import { animate, stagger, svg } from "animejs";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Builder choices arrive as one calm composition, not as independent bouncing tiles. */
export function animateStepIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(
    container.querySelectorAll(
      ".cw-choice-grid > *, .cw-summary, .cw-lead, .cw-industry-tip, .cw-custom",
    ),
  ) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [7, 0],
    scale: [0.992, 1],
    delay: stagger(22, { start: 28 }),
    duration: 360,
    ease: "outExpo",
  });
}

/* Quick choices arrive together and remain visually anchored above the input. */
export function animateChipsIn(container: HTMLElement | null): void {
  if (!container || prefersReducedMotion()) return;
  const targets = Array.from(container.querySelectorAll(":scope > .cw-chip")) as HTMLElement[];
  if (targets.length === 0) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [5, 0],
    delay: stagger(28, { start: 40 }),
    duration: 300,
    ease: "outCubic",
  });
}

/* A sent message leaves the composer with a controlled pop and settles without bounce. */
export function animateSentMessage(row: HTMLElement | null): void {
  if (!row || prefersReducedMotion()) return;
  animate(row, {
    opacity: [0, 1],
    translateY: [11, 0],
    translateX: [7, 0],
    scale: [0.965, 1],
    duration: 410,
    ease: "outExpo",
  });
}

/* Replies enter more softly than outgoing messages so the conversation remains calm. */
export function animateReceivedMessage(row: HTMLElement | null): void {
  if (!row || prefersReducedMotion()) return;
  animate(row, {
    opacity: [0, 1],
    translateY: [7, 0],
    scale: [0.985, 1],
    duration: 360,
    ease: "outCubic",
  });
}

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
