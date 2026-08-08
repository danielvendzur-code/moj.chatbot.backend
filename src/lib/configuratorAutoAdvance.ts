import {
  FEATURES,
  INDUSTRY_RECOMMENDED_FEATURES,
  RECOMMENDED_FEATURES,
} from "./assistantFlow";
import type { InterestId } from "../types/assistant";

const SINGLE_CHOICE_SELECTOR = ".cw-rowcard, .cw-scard, .cw-vcard";
const BACK_SELECTOR = ".cw-progress__back, .cw-tabs, .cw-panel-head__actions";
const INSTALL_FLAG = "cwConfiguratorAutoAdvance";
/* The check is now static, so a short confirmation pause is enough to make the
   selected answer register without making the flow feel delayed. */
const CONFIRM_MS = 420;
/* A fresh step must not inherit the pointer-up/click that selected the previous
   card. Keep its choices inert only through the step hand-off, then release
   automatically even if the pointer has not moved. */
const FRESH_STEP_GUARD_MS = 360;
const POINTER_RELEASE_DISTANCE = 8;
const ACTION_ANIMATION_MS = 520;

const unique = (values: string[]): string[] => [...new Set(values)];

const optionId = (button: HTMLButtonElement, prefix: string): string | null => {
  const testId = button.dataset.testid ?? "";
  return testId.startsWith(prefix) ? testId.slice(prefix.length) : null;
};

const animateHeaderAction = (
  button: HTMLButtonElement,
  action: "reset" | "close",
): void => {
  button.dataset.actionAnimating = action;
  window.setTimeout(() => {
    if (button.dataset.actionAnimating === action) {
      delete button.dataset.actionAnimating;
    }
  }, ACTION_ANIMATION_MS);
};

const syncSelectedContext = (widget: HTMLElement): void => {
  const interestButtons = Array.from(
    widget.querySelectorAll<HTMLButtonElement>('[data-testid^="interest-"]'),
  );
  if (interestButtons.length) {
    const selected = interestButtons.find(
      (button) => button.dataset.selected === "true",
    );
    const nextInterest = selected ? optionId(selected, "interest-") : null;
    if (nextInterest && widget.dataset.selectedInterest !== nextInterest) {
      widget.dataset.selectedInterest = nextInterest;
      delete widget.dataset.featureRecommendationContext;
    }
    delete widget.dataset.selectedIndustry;
  }

  const selectedIndustry = widget.querySelector<HTMLButtonElement>(
    '[data-testid^="industry-"][data-selected="true"]',
  );
  const industry = selectedIndustry
    ? optionId(selectedIndustry, "industry-")
    : null;
  if (industry && widget.dataset.selectedIndustry !== industry) {
    widget.dataset.selectedIndustry = industry;
    delete widget.dataset.featureRecommendationContext;
  }
};

const arrangeAndRecommendFeatures = (widget: HTMLElement): void => {
  const grid = widget.querySelector<HTMLElement>(".cw-choice-grid--features");
  if (!grid) return;

  const buttons = Array.from(
    grid.querySelectorAll<HTMLButtonElement>('[data-testid^="feature-"]'),
  );
  if (!buttons.length) return;

  const interest = widget.dataset.selectedInterest as InterestId | undefined;
  const industry = widget.dataset.selectedIndustry;
  const relevant = unique([
    ...(industry ? INDUSTRY_RECOMMENDED_FEATURES[industry] ?? [] : []),
    ...(interest ? RECOMMENDED_FEATURES[interest] ?? [] : []),
  ]).filter((id) => FEATURES.some((feature) => feature.id === id));
  const ordered = unique([...relevant, ...FEATURES.map((feature) => feature.id)]);
  const recommended = relevant.slice(0, 3);

  buttons.forEach((button) => {
    const id = optionId(button, "feature-");
    if (!id) return;
    button.style.order = String(Math.max(0, ordered.indexOf(id)));
    if (recommended.includes(id)) button.dataset.recommended = "true";
    else delete button.dataset.recommended;
  });

  const context = `${interest ?? "none"}|${industry ?? "none"}`;
  if (widget.dataset.featureRecommendationContext !== context) {
    widget.dataset.featureRecommendationContext = context;
    recommended.forEach((id) => {
      const button = grid.querySelector<HTMLButtonElement>(
        `[data-testid="feature-${id}"]`,
      );
      if (button && button.dataset.selected !== "true") button.click();
    });
  }

  grid.dataset.ready = "true";
};

const scanWidgets = (): void => {
  document.querySelectorAll<HTMLElement>(".cw-widget").forEach((widget) => {
    syncSelectedContext(widget);
    arrangeAndRecommendFeatures(widget);
  });
};

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
    let releaseTimer: number | null = null;

    const clearParked = () => {
      if (released) return;
      released = true;
      delete widget.dataset.pointerParked;
      widget.removeEventListener("pointermove", release);
      widget.removeEventListener("keydown", clearParked);
      if (releaseTimer !== null) window.clearTimeout(releaseTimer);
      releaseTimer = null;
      releaseParkedPointer = null;
    };
    const release = (move: PointerEvent) => {
      if (
        Math.hypot(move.clientX - originX, move.clientY - originY) <
        POINTER_RELEASE_DISTANCE
      ) {
        return;
      }
      clearParked();
    };

    widget.addEventListener("pointermove", release);
    widget.addEventListener("keydown", clearParked);
    releaseTimer = window.setTimeout(clearParked, FRESH_STEP_GUARD_MS);
    releaseParkedPointer = clearParked;
  };

  const observer = new MutationObserver(scanWidgets);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-selected"],
  });
  scanWidgets();

  document.addEventListener(
    "click",
    (event) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element) return;

      const resetButton = element.closest<HTMLButtonElement>(
        '[data-testid="widget-reset"]',
      );
      if (resetButton) {
        animateHeaderAction(resetButton, "reset");
        const widget = resetButton.closest<HTMLElement>(".cw-widget");
        if (widget) {
          delete widget.dataset.selectedInterest;
          delete widget.dataset.selectedIndustry;
          delete widget.dataset.featureRecommendationContext;
        }
      }

      const closeButton = element.closest<HTMLButtonElement>(
        '[data-testid="widget-close"]',
      );
      if (closeButton) animateHeaderAction(closeButton, "close");

      const interestButton = element.closest<HTMLButtonElement>(
        '[data-testid^="interest-"]',
      );
      if (interestButton) {
        const widget = interestButton.closest<HTMLElement>(".cw-widget");
        const interest = optionId(interestButton, "interest-");
        if (widget && interest) {
          widget.dataset.selectedInterest = interest;
          delete widget.dataset.selectedIndustry;
          delete widget.dataset.featureRecommendationContext;
        }
      }

      const industryButton = element.closest<HTMLButtonElement>(
        '[data-testid^="industry-"]',
      );
      if (industryButton) {
        const widget = industryButton.closest<HTMLElement>(".cw-widget");
        const industry = optionId(industryButton, "industry-");
        if (widget && industry) {
          widget.dataset.selectedIndustry = industry;
          delete widget.dataset.featureRecommendationContext;
        }
      }

      if (element.closest(BACK_SELECTOR)) {
        cancel();
        return;
      }

      const target = element.closest<HTMLButtonElement>(SINGLE_CHOICE_SELECTOR);
      if (
        !target ||
        target.disabled ||
        target.dataset.testid === "interest-custom"
      ) {
        return;
      }

      if (target.dataset.selected === "true") {
        cancel();
        return;
      }

      const originX = event instanceof MouseEvent ? event.clientX : 0;
      const originY = event instanceof MouseEvent ? event.clientY : 0;

      cancel();
      confirming = target;
      target.dataset.confirming = "true";
      pending = window.setTimeout(
        () => {
          pending = null;
          const widget = target.closest<HTMLElement>(".cw-widget");
          if (!widget) return;

          target.blur();
          guardFreshStep(widget, originX, originY);

          const next = widget.querySelector<HTMLButtonElement>(
            ".cw-next:not(:disabled)",
          );
          if (!next) {
            delete target.dataset.confirming;
            confirming = null;
            releaseParkedPointer?.();
            return;
          }
          confirming = null;
          next.click();
        },
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 80
          : CONFIRM_MS,
      );
    },
    true,
  );
}
