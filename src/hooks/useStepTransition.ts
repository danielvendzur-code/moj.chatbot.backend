import { useEffect, useRef, useState, type RefObject } from "react";

/* How long the outgoing step is given to fade up and out. Must match
   `cw-step-out` in the stylesheet. */
export const STEP_EXIT_MS = 72;
/* Longest incoming animation (the last staggered chip), after which the height
   lock can be released without anything visibly settling. */
const STEP_ENTER_MS = 640;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type StepTransition = {
  /* The step whose content is on screen right now. Lags `step` by one exit. */
  visibleStep: number;
  /* True while the old step is fading out. */
  leaving: boolean;
  direction: "forward" | "backward";
};

/* Swaps one step for the next without the panel resizing under the pointer.
   Forward navigation briefly holds the outgoing height while the next step
   arrives. Backward navigation releases that lock immediately: otherwise a
   tall contact step leaves a large empty block behind for 640 ms after Back. */
export function useStepTransition(
  step: number,
  containerRef: RefObject<HTMLElement>,
): StepTransition {
  const [visibleStep, setVisibleStep] = useState(step);
  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const releaseRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === visibleStep) return;

    const nextDirection = step > visibleStep ? "forward" : "backward";
    setDirection(nextDirection);

    const container = containerRef.current;
    if (releaseRef.current !== null) {
      window.clearTimeout(releaseRef.current);
      releaseRef.current = null;
    }

    if (prefersReducedMotion()) {
      if (container) container.style.minHeight = "";
      setVisibleStep(step);
      setLeaving(false);
      return;
    }

    if (container) {
      if (nextDirection === "forward") {
        container.style.minHeight = `${Math.ceil(container.getBoundingClientRect().height)}px`;
      } else {
        container.style.minHeight = "";
      }
    }

    setLeaving(true);
    const swap = window.setTimeout(() => {
      setVisibleStep(step);
      setLeaving(false);
      if (nextDirection === "backward" && container) {
        container.style.minHeight = "";
      }
    }, STEP_EXIT_MS);

    return () => window.clearTimeout(swap);
  }, [containerRef, step, visibleStep]);

  /* Once a forward step has arrived, drop its temporary height lock after the
     staggered entrance. Backward steps never keep the lock. */
  useEffect(() => {
    if (leaving) return;
    const container = containerRef.current;
    if (!container || !container.style.minHeight) return;

    if (direction === "backward") {
      container.style.minHeight = "";
      return;
    }

    releaseRef.current = window.setTimeout(() => {
      releaseRef.current = null;
      container.style.minHeight = "";
    }, STEP_ENTER_MS);

    return () => {
      if (releaseRef.current !== null) window.clearTimeout(releaseRef.current);
      releaseRef.current = null;
    };
  }, [containerRef, direction, leaving, visibleStep]);

  useEffect(
    () => () => {
      if (releaseRef.current !== null) window.clearTimeout(releaseRef.current);
      const container = containerRef.current;
      if (container) container.style.minHeight = "";
    },
    [containerRef],
  );

  return { visibleStep, leaving, direction };
}
