import "../mobile-configurator-polish.css";
import "../configurator-runtime-final.css";

const SINGLE_CHOICE_SELECTOR = ".cw-rowcard, .cw-scard, .cw-vcard";
const BACK_SELECTOR = ".cw-progress__back, .cw-tabs, .cw-panel-head__actions";
const INSTALL_FLAG = "cwConfiguratorAutoAdvance";
const CONFIRM_MS = 220;
const POINTER_RELEASE_DISTANCE = 8;

export function installConfiguratorAutoAdvance(): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset[INSTALL_FLAG] === "true") return;

  document.documentElement.dataset[INSTALL_FLAG] = "true";

  let pending: number | null = null;
  let confirming: HTMLButtonElement | null = null;
  let releaseParkedPointer: (() => void) | null = null;

  const cancel = () => {
    if (pending !== null) {
      window.clearTimeout(pending);
      pending = null;
    }
    if (confirming) delete confirming.dataset.confirming;
    confirming = null;
    releaseParkedPointer?.();
  };

  const guardFreshStep = (widget: HTMLElement, originX: number, originY: number) => {
    releaseParkedPointer?.();
    widget.dataset.pointerParked = "true";

    let released = false;
    const clearParked = () => {
      if (released) return;
      released = true;
      delete widget.dataset.pointerParked;
      widget.removeEventListener("pointermove", release);
      widget.removeEventListener("pointerdown", clearParked);
      widget.removeEventListener("keydown", clearParked);
      releaseParkedPointer = null;
    };
    const release = (move: PointerEvent) => {
      /* React replaces the card under a stationary cursor. Browsers may emit a
         synthetic pointermove for that DOM change; only actual movement should
         restore hover styling. */
      if (Math.hypot(move.clientX - originX, move.clientY - originY) < POINTER_RELEASE_DISTANCE) return;
      clearParked();
    };

    widget.addEventListener("pointermove", release);
    widget.addEventListener("pointerdown", clearParked);
    widget.addEventListener("keydown", clearParked);
    releaseParkedPointer = clearParked;
  };

  document.addEventListener(
    "click",
    (event) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element) return;

      if (element.closest(BACK_SELECTOR)) {
        cancel();
        return;
      }

      const target = element.closest<HTMLButtonElement>(SINGLE_CHOICE_SELECTOR);
      if (!target || target.disabled || target.dataset.testid === "interest-custom") return;

      if (target.dataset.selected === "true") {
        cancel();
        return;
      }

      const originX = event instanceof MouseEvent ? event.clientX : 0;
      const originY = event instanceof MouseEvent ? event.clientY : 0;

      cancel();
      confirming = target;
      target.dataset.confirming = "true";
      pending = window.setTimeout(() => {
        pending = null;
        const widget = target.closest<HTMLElement>(".cw-widget");
        if (!widget) return;

        target.blur();
        guardFreshStep(widget, originX, originY);

        const next = widget.querySelector<HTMLButtonElement>(".cw-next:not(:disabled)");
        if (!next) {
          delete target.dataset.confirming;
          confirming = null;
          releaseParkedPointer?.();
          return;
        }
        confirming = null;
        next.click();
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 32 : CONFIRM_MS);
    },
    true,
  );
}
