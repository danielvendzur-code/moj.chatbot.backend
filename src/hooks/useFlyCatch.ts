import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type FlyCatchPhase = "idle" | "watching" | "feeding";

export function useFlyCatch(): { phase: FlyCatchPhase; trigger: () => void } {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<FlyCatchPhase>("idle");
  const scheduleTimerRef = useRef<number | null>(null);
  const sequenceTimersRef = useRef<number[]>([]);

  const clearSchedule = useCallback(() => {
    if (scheduleTimerRef.current !== null) window.clearTimeout(scheduleTimerRef.current);
    scheduleTimerRef.current = null;
  }, []);

  const clearSequence = useCallback(() => {
    sequenceTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    sequenceTimersRef.current = [];
  }, []);

  const trigger = useCallback(() => {
    if (reducedMotion || document.hidden) return;

    clearSchedule();
    clearSequence();
    setPhase("watching");
    sequenceTimersRef.current.push(
      window.setTimeout(() => setPhase("feeding"), 650),
      window.setTimeout(() => setPhase("idle"), 1_550),
    );
  }, [clearSchedule, clearSequence, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || phase !== "idle" || document.hidden) return;

    const delay = 7_500 + Math.random() * 7_000;
    scheduleTimerRef.current = window.setTimeout(trigger, delay);
    return clearSchedule;
  }, [clearSchedule, phase, reducedMotion, trigger]);

  useEffect(() => {
    const onVisibilityChange = () => {
      clearSchedule();
      clearSequence();
      setPhase("idle");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearSchedule();
      clearSequence();
    };
  }, [clearSchedule, clearSequence]);

  return { phase, trigger };
}
