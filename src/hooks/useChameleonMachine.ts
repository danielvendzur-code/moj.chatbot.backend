import { useCallback, useEffect, useRef, useState } from "react";
import type { ChameleonState } from "../types/assistant";
import { useReducedMotion } from "./useReducedMotion";

const PROMPT_SESSION_KEY = "site-assistant-mascot-prompt-seen";

type ChameleonMachineOptions = {
  isOpen: boolean;
  blocked: boolean;
};

type ChameleonMachine = {
  state: ChameleonState;
  reducedMotion: boolean;
  flyVisible: boolean;
  promptVisible: boolean;
  sceneVisible: boolean;
  launcherReady: boolean;
  dismissPrompt: () => void;
  notifyActivity: () => void;
  triggerFly: () => void;
};

function hasSeenPrompt(): boolean {
  try {
    return sessionStorage.getItem(PROMPT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
function rememberPrompt(): void {
  try {
    sessionStorage.setItem(PROMPT_SESSION_KEY, "1");
  } catch {
    // The widget still works when browser storage is unavailable.
  }
}

export function useChameleonMachine({ isOpen, blocked }: ChameleonMachineOptions): ChameleonMachine {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<ChameleonState>("page-idle");
  const [flyVisible, setFlyVisible] = useState(false);
  const [visibilityTick, setVisibilityTick] = useState(0);
  const stateRef = useRef(state);
  const openRef = useRef(isOpen);
  const activityUntilRef = useRef(0);
  const flyTimersRef = useRef<number[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  const clearFlyRun = useCallback(() => {
    flyTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    flyTimersRef.current = [];
    setFlyVisible(false);
  }, []);

  useEffect(() => clearFlyRun, [clearFlyRun]);

  useEffect(() => {
    let timer = 0;

    if (blocked) {
      clearFlyRun();
      return;
    }

    if (isOpen) {
      rememberPrompt();
      if (["page-idle", "noticed-fly", "walking-to-launcher", "arrived-at-launcher", "prompting", "sleeping"].includes(state)) {
        setState("opening-assistant");
      } else if (state === "opening-assistant") {
        timer = window.setTimeout(() => setState("inside-assistant"), reducedMotion ? 30 : 420);
      }
      return () => window.clearTimeout(timer);
    }

    if (["opening-assistant", "inside-assistant"].includes(state)) {
      setState("arrived-at-launcher");
      return;
    }

    if (reducedMotion) {
      if (!["arrived-at-launcher", "prompting", "watching", "feeding"].includes(state)) {
        setState("arrived-at-launcher");
      }
      return;
    }

    switch (state) {
      case "page-idle":
        timer = window.setTimeout(() => setState("noticed-fly"), 4800);
        break;
      case "noticed-fly":
        timer = window.setTimeout(() => setState("walking-to-launcher"), 620);
        break;
      case "walking-to-launcher":
        timer = window.setTimeout(() => setState("arrived-at-launcher"), 2850);
        break;
      case "arrived-at-launcher":
        if (!hasSeenPrompt()) {
          timer = window.setTimeout(() => setState("prompting"), 520);
        }
        break;
      default:
        break;
    }

    return () => window.clearTimeout(timer);
  }, [blocked, clearFlyRun, isOpen, reducedMotion, state]);

  useEffect(() => {
    const skipLongJourney = () => {
      if (
        !openRef.current &&
        window.scrollY > window.innerHeight * 0.38 &&
        ["page-idle", "noticed-fly", "walking-to-launcher"].includes(stateRef.current)
      ) {
        setState("arrived-at-launcher");
      }
    };
    window.addEventListener("scroll", skipLongJourney, { passive: true });
    return () => window.removeEventListener("scroll", skipLongJourney);
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisibilityTick((value) => value + 1);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const triggerFly = useCallback(() => {
    const current = stateRef.current;
    const allowed = ["arrived-at-launcher", "inside-assistant"].includes(current);
    if (
      !allowed ||
      reducedMotion ||
      blocked ||
      document.hidden ||
      Date.now() < activityUntilRef.current ||
      flyVisible
    ) {
      return;
    }

    clearFlyRun();
    setFlyVisible(true);
    setState("watching");
    flyTimersRef.current.push(
      window.setTimeout(() => setState("feeding"), 320),
      window.setTimeout(() => {
        setFlyVisible(false);
        setState(openRef.current ? "inside-assistant" : "arrived-at-launcher");
        flyTimersRef.current = [];
      }, 1060),
    );
  }, [blocked, clearFlyRun, flyVisible, reducedMotion]);

  useEffect(() => {
    if (
      reducedMotion ||
      blocked ||
      document.hidden ||
      flyVisible ||
      !["arrived-at-launcher", "inside-assistant"].includes(state)
    ) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const min = mobile ? 14000 : 9000;
    const spread = mobile ? 8000 : 9000;
    const timer = window.setTimeout(triggerFly, min + Math.random() * spread);
    return () => window.clearTimeout(timer);
  }, [blocked, flyVisible, reducedMotion, state, triggerFly, visibilityTick]);

  const dismissPrompt = useCallback(() => {
    rememberPrompt();
    if (stateRef.current === "prompting") setState("arrived-at-launcher");
  }, []);

  const notifyActivity = useCallback(() => {
    activityUntilRef.current = Date.now() + 5500;
    if (stateRef.current === "sleeping") {
      setState(openRef.current ? "inside-assistant" : "arrived-at-launcher");
    }
  }, []);

  const sceneVisible = ["page-idle", "noticed-fly", "walking-to-launcher"].includes(state) && !isOpen;
  const launcherReady = !sceneVisible && !isOpen && !blocked;

  return {
    state,
    reducedMotion,
    flyVisible,
    promptVisible: state === "prompting" && !isOpen && !blocked,
    sceneVisible,
    launcherReady,
    dismissPrompt,
    notifyActivity,
    triggerFly,
  };
}
