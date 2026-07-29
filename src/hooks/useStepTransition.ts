import { useEffect, useRef, useState, type RefObject } from "react";

/* How long the outgoing step is given to fade up and out. Must match
   `cw-step-out` in the stylesheet. */
export const STEP_EXIT_MS = 180;
/* Longest incoming animation (the last staggered chip), after which the height
   lock can be released without anything visibly settling. */
const STEP_ENTER_MS = 740;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type StepTransition = {
  /* The step whose content is on screen right now. Lags `step` by one exit. */
  visibleStep: number;
  /* True while the old step is fading out. */
  leaving: boolean;
};

/* Swaps one step for the next without the panel resizing under the pointer:
   the container keeps the outgoing height until the new step has arrived. With
   reduced motion the swap is instant and no height is ever locked. */
export function useStepTransition(
  step: number,
  containerRef: RefObject<HTMLElement>,
): StepTransition {
  const [visibleStep, setVisibleStep] = useState(step);
  const [leaving, setLeaving] = useState(false);
  const releaseRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === visibleStep) return;

    if (prefersReducedMotion()) {
      setVisibleStep(step);
      return;
    }

    const container = containerRef.current;
    if (container) {
      if (releaseRef.current !== null) window.clearTimeout(releaseRef.current);
      container.style.minHeight = `${Math.ceil(container.getBoundingClientRect().height)}px`;
    }

    setLeaving(true);
    const swap = window.setTimeout(() => {
      setVisibleStep(step);
      setLeaving(false);
    }, STEP_EXIT_MS);

    return () => window.clearTimeout(swap);
  }, [containerRef, step, visibleStep]);

  /* Once the new step is in place the lock is dropped, so a taller or shorter
     step can find its own height again. */
  useEffect(() => {
    if (leaving) return;
    const container = containerRef.current;
    if (!container || !container.style.minHeight) return;

    releaseRef.current = window.setTimeout(() => {
      releaseRef.current = null;
      container.style.minHeight = "";
    }, STEP_ENTER_MS);

    return () => {
      if (releaseRef.current !== null) window.clearTimeout(releaseRef.current);
      releaseRef.current = null;
    };
  }, [containerRef, leaving, visibleStep]);

  return { visibleStep, leaving };
}
