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

const TILT_SELECTOR =
  ".cw-widget :is(.cw-chip, .cw-rowcard, .cw-scard, .cw-vcard, .cw-opt, .cw-contact-method)";
const INSTALL_FLAG = "cwPremiumTilt";

/** Degrees at the very edge of the element. Small on purpose — this is a lean, not a flip. */
const MAX_TILT = 3.2;

export function installPremiumTilt(): () => void {
  const noop = () => undefined;
  if (typeof document === "undefined" || typeof window === "undefined")
    return noop;
  if (document.documentElement.dataset[INSTALL_FLAG] === "true") return noop;

  /* Tilt is a fine-pointer affordance. On touch there is no hover to express
     it with, and under reduced motion it should not exist at all. */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return noop;

  document.documentElement.dataset[INSTALL_FLAG] = "true";

  let active: HTMLElement | null = null;
  let pendingTarget: HTMLElement | null = null;
  let pendingClientX = 0;
  let pendingClientY = 0;
  let frame = 0;
  let disposed = false;

  const clear = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.removeProperty("--cw-tilt-x");
    element.style.removeProperty("--cw-tilt-y");
    delete element.dataset.tilting;
  };

  const reset = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    pendingTarget = null;
    clear(active);
    active = null;
  };

  /* Pointer events can arrive much faster than the screen can paint. One DOM
     read and one group of style writes per frame keeps the effect smooth while
     avoiding a forced layout on every raw pointer event. */
  const paint = () => {
    frame = 0;
    const target = pendingTarget;

    if (target !== active) {
      clear(active);
      active = target;
    }
    if (!target?.isConnected) {
      clear(active);
      active = null;
      pendingTarget = null;
      return;
    }

    const box = target.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    /* -1 .. 1 from the centre of the element. */
    const x = (pendingClientX - box.left) / box.width - 0.5;
    const y = (pendingClientY - box.top) / box.height - 0.5;

    target.dataset.tilting = "true";
    target.style.setProperty(
      "--cw-tilt-y",
      `${(x * 2 * MAX_TILT).toFixed(2)}deg`,
    );
    target.style.setProperty(
      "--cw-tilt-x",
      `${(-y * 2 * MAX_TILT).toFixed(2)}deg`,
    );
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;

    const element = event.target instanceof Element ? event.target : null;
    pendingTarget = element?.closest<HTMLElement>(TILT_SELECTOR) ?? null;
    pendingClientX = event.clientX;
    pendingClientY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paint);
  };

  /* `pointerleave` on document fires while crossing descendants in some
     engines. A bubbling pointerout plus containment check only clears once the
     pointer has actually left the active card. */
  const onPointerOut = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const current = active ?? pendingTarget;
    const source = event.target instanceof Node ? event.target : null;
    if (!current || !source || !current.contains(source)) return;

    const related = event.relatedTarget;
    if (related instanceof Node && current.contains(related)) return;
    reset();
  };

  /* Picking an answer settles the card flat rather than leaving it leaning. */
  const onClick = (event: MouseEvent) => {
    const element = event.target instanceof Element ? event.target : null;
    const target = element?.closest<HTMLElement>(TILT_SELECTOR) ?? null;
    if (!target) return;
    if (active === target || pendingTarget === target) reset();
    else clear(target);
  };

  const onPreferenceChange = () => {
    if (!finePointer.matches || reducedMotion.matches) reset();
  };

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    reset();
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("blur", reset);
    window.removeEventListener("pagehide", cleanup);
    finePointer.removeEventListener("change", onPreferenceChange);
    reducedMotion.removeEventListener("change", onPreferenceChange);
    delete document.documentElement.dataset[INSTALL_FLAG];
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  document.addEventListener("click", onClick, true);
  window.addEventListener("blur", reset);
  window.addEventListener("pagehide", cleanup, { once: true });
  finePointer.addEventListener("change", onPreferenceChange);
  reducedMotion.addEventListener("change", onPreferenceChange);

  return cleanup;
}
