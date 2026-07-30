/**
 * Pointer-following tilt for chips and choice cards.
 *
 * The card leans a couple of degrees toward the cursor and eases back to flat
 * when the pointer leaves or the answer is picked. It is rotation only — never
 * a translate — because a lift on hover that the selected state did not match
 * is exactly what used to make the chips look like they jumped when clicked.
 *
 * Everything here is opt-in at the CSS layer: this file only publishes
 * --cw-tilt-x / --cw-tilt-y, and the stylesheet decides whether to use them.
 */

const TILT_SELECTOR = ".cw-chip, .cw-rowcard, .cw-scard, .cw-vcard, .cw-opt, .cw-contact-method";
const INSTALL_FLAG = "cwPremiumTilt";

/** Degrees at the very edge of the element. Small on purpose — this is a lean, not a flip. */
const MAX_TILT = 3.2;

export function installPremiumTilt(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (document.documentElement.dataset[INSTALL_FLAG] === "true") return;

  /* Tilt is a fine-pointer affordance. On touch there is no hover to express
     it with, and under reduced motion it should not exist at all. */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return;

  document.documentElement.dataset[INSTALL_FLAG] = "true";

  let active: HTMLElement | null = null;

  const clear = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.removeProperty("--cw-tilt-x");
    element.style.removeProperty("--cw-tilt-y");
    delete element.dataset.tilting;
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;

      const element = event.target instanceof Element ? event.target : null;
      const target = element?.closest<HTMLElement>(TILT_SELECTOR) ?? null;

      if (target !== active) {
        clear(active);
        active = target;
      }
      if (!target) return;

      const box = target.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;

      /* -1 .. 1 from the centre of the element. */
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;

      target.dataset.tilting = "true";
      target.style.setProperty("--cw-tilt-y", `${(x * 2 * MAX_TILT).toFixed(2)}deg`);
      target.style.setProperty("--cw-tilt-x", `${(-y * 2 * MAX_TILT).toFixed(2)}deg`);
    },
    { passive: true },
  );

  /* Picking an answer settles the card flat rather than leaving it leaning. */
  document.addEventListener(
    "click",
    (event) => {
      const element = event.target instanceof Element ? event.target : null;
      const target = element?.closest<HTMLElement>(TILT_SELECTOR) ?? null;
      if (!target) return;
      clear(target);
      if (active === target) active = null;
    },
    true,
  );

  document.addEventListener("pointerleave", () => clear(active), true);
  window.addEventListener("blur", () => {
    clear(active);
    active = null;
  });
}
