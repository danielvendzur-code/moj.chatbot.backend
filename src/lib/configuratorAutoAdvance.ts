import "../mobile-configurator-polish.css";
import "../configurator-runtime-final.css";

const SINGLE_CHOICE_SELECTOR = ".cw-rowcard, .cw-scard, .cw-vcard";
const INSTALL_FLAG = "cwConfiguratorAutoAdvance";

export function installConfiguratorAutoAdvance(): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset[INSTALL_FLAG] === "true") return;

  document.documentElement.dataset[INSTALL_FLAG] = "true";

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>(SINGLE_CHOICE_SELECTOR)
          : null;

      if (!target || target.disabled || target.dataset.testid === "interest-custom") return;

      window.setTimeout(() => {
        const widget = target.closest<HTMLElement>(".cw-widget");
        const next = widget?.querySelector<HTMLButtonElement>(".cw-next:not(:disabled)");
        next?.click();
      }, 130);
    },
    true,
  );
}
