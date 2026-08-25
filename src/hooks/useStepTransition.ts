import { useEffect, useRef, useState, type RefObject } from "react";

export const STEP_EXIT_MS = 170;
const STEP_ENTER_MS = 560;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type StepTransition = {
  visibleStep: number;
  leaving: boolean;
  direction: "forward" | "backward";
};

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
      setVisibleStep(step);
      if (container) container.style.minHeight = "";
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
