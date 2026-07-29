import { useEffect, useRef, useState } from "react";

const DURATION = 900;

/* The same shape as the site easing, so the number settles like everything else. */
const easeOutQuint = (t: number): number => 1 - (1 - t) ** 5;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Counts a number up towards `value`. With reduced motion the final value is
   returned straight away, on the first paint too — the figure is content, so it
   may never be missing or stuck mid-count. */
export function useCountUp(value: number, duration = DURATION): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const shownRef = useRef(shown);
  const frameRef = useRef<number | null>(null);

  shownRef.current = shown;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }

    const from = shownRef.current;
    if (from === value) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(
        progress === 1 ? value : Math.round(from + (value - from) * easeOutQuint(progress)),
      );
      frameRef.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [duration, value]);

  /* If the animation was cut short, the honest number still wins. */
  useEffect(() => {
    if (frameRef.current !== null) return;
    if (shownRef.current !== value) setShown(value);
  }, [shown, value]);

  return shown;
}
