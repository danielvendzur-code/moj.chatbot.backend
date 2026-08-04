import productRefinementCss from "../product-refinement.css?inline";

const STYLE_ID = "dv-assistant-product-refinement";

declare global {
  interface Window {
    dvAssistantProductRefinementInstalled?: boolean;
  }
}

/**
 * The conversation component deliberately focuses its input after a mode
 * change. That is useful on a desktop, but on an embedded phone it immediately
 * opens the keyboard and activates the compact composing layout before the
 * visitor has seen the builder CTA, starter chips or contact choices. Only an
 * explicit pointer press on the composer or keyboard Tab navigation is allowed
 * to focus it; incidental programmatic focus is released on the next frame.
 */
function protectInitialComposerState(): void {
  let lastPointerTarget: EventTarget | null = null;
  let keyboardNavigationAt = -Infinity;

  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPointerTarget = event.target;
      window.setTimeout(() => {
        if (lastPointerTarget === event.target) lastPointerTarget = null;
      }, 240);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Tab") keyboardNavigationAt = performance.now();
    },
    true,
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (!input.closest(".cw-inputbar")) return;

      const pointerRequestedComposer =
        lastPointerTarget instanceof Node &&
        (lastPointerTarget === input || input.contains(lastPointerTarget));
      const keyboardRequestedComposer =
        performance.now() - keyboardNavigationAt < 320;

      if (pointerRequestedComposer || keyboardRequestedComposer) return;

      window.requestAnimationFrame(() => {
        if (document.activeElement === input) input.blur();
      });
    },
    true,
  );
}

export function installProductRefinement(): void {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.dvAssistantRefinement = "premium-widget-20260804-v2";
    style.textContent = productRefinementCss;
    document.head.appendChild(style);
  }

  if (window.dvAssistantProductRefinementInstalled) return;
  window.dvAssistantProductRefinementInstalled = true;
  protectInitialComposerState();
}
