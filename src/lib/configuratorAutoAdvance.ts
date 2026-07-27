import "../mobile-configurator-polish.css";
import "../configurator-runtime-final.css";

const SINGLE_CHOICE_SELECTOR = ".cw-rowcard, .cw-scard, .cw-vcard";
const BACK_SELECTOR = ".cw-progress__back, .cw-tabs, .cw-panel-head__actions";
const INSTALL_FLAG = "cwConfiguratorAutoAdvance";

export function installConfiguratorAutoAdvance(): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset[INSTALL_FLAG] === "true") return;

  document.documentElement.dataset[INSTALL_FLAG] = "true";

  let pending: number | null = null;
  const cancel = () => {
    if (pending !== null) {
      window.clearTimeout(pending);
      pending = null;
    }
  };

  document.addEventListener(
    "click",
    (event) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element) return;

      /* Going back (or switching mode) must never be overridden by a queued
         auto-advance — that made the back button look broken. */
      if (element.closest(BACK_SELECTOR)) {
        cancel();
        return;
      }

      const target = element.closest<HTMLButtonElement>(SINGLE_CHOICE_SELECTOR);
      if (!target || target.disabled || target.dataset.testid === "interest-custom") return;

      /* Only advance when the click actually changes the answer. Re-clicking the
         option that is already selected (which is what sits under the cursor
         right after pressing back) must keep you on the step. */
      if (target.dataset.selected === "true") {
        cancel();
        return;
      }

      cancel();
      pending = window.setTimeout(() => {
        pending = null;
        const widget = target.closest<HTMLElement>(".cw-widget");
        const next = widget?.querySelector<HTMLButtonElement>(".cw-next:not(:disabled)");
        next?.click();
      }, 130);
    },
    true,
  );
}
