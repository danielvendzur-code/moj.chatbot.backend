import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  installSiteAssistantGlobal,
  SITE_ASSISTANT_OPEN_EVENT,
} from "../../lib/siteAssistant";
import { announceEmbedState, installEmbedBridge } from "../../lib/embedBridge";
import { track } from "../../lib/analytics";
import type {
  AssistantPreset,
  OpenSiteAssistantOptions,
} from "../../types/assistant";
import "../../liquid-glass-final.css";
import "../../tinder-swipe-final.css";
import { AssistantConversation } from "./AssistantConversation";
import { BubbleLogo } from "./BubbleLogo";
import { ToolCalculator } from "./ToolCalculator";
import { WidgetIcon } from "./WidgetIcon";

type WidgetMode = "assistant" | "calculator";
type SwipeDirection = "forward" | "backward";
type ActionAnimation = "reset" | "close" | null;
type SwipeStart = { x: number; y: number };

type AssistantWidgetProps = {
  embedMode?: boolean;
};

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(
    value && ["calculator", "product", "inquiry", "advisor", "booking"].includes(value),
  );

const PANEL_EXIT_MS = 220;
const ACTION_ANIMATION_MS = 520;
const SWIPE_THRESHOLD_PX = 26;
const BODY_SWIPE_THRESHOLD_PX = 54;

const reducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isInteractiveSwipeTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(
    target.closest(
      "button, a, input, textarea, select, summary, label, [role='button'], [contenteditable='true']",
    ),
  );

export function AssistantWidget({
  embedMode = false,
}: AssistantWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("assistant");
  const [transitionDirection, setTransitionDirection] =
    useState<SwipeDirection>("forward");
  const [actionAnimating, setActionAnimating] =
    useState<ActionAnimation>(null);
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<AssistantPreset | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const actionTimerRef = useRef<number | null>(null);
  const tabSwipeStartRef = useRef<SwipeStart | null>(null);
  const bodySwipeStartRef = useRef<SwipeStart | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const calculatorViewRef = useRef<HTMLDivElement>(null);
  const assistantViewRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const restoreLauncherFocusRef = useRef(false);

  const clearActionTimer = useCallback(() => {
    if (actionTimerRef.current !== null) {
      window.clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
  }, []);

  const animateAction = useCallback(
    (action: Exclude<ActionAnimation, null>) => {
      clearActionTimer();
      setActionAnimating(action);
      if (reducedMotion()) {
        setActionAnimating(null);
        return;
      }
      actionTimerRef.current = window.setTimeout(() => {
        actionTimerRef.current = null;
        setActionAnimating(null);
      }, ACTION_ANIMATION_MS);
    },
    [clearActionTimer],
  );

  const close = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
    animateAction("close");
    setIsClosing(true);
    track("widget_close");

    const finish = () => {
      closeTimerRef.current = null;
      openRef.current = false;
      closingRef.current = false;
      restoreLauncherFocusRef.current = true;
      setIsOpen(false);
      setIsClosing(false);
    };

    if (reducedMotion()) {
      finish();
      return;
    }
    closeTimerRef.current = window.setTimeout(finish, PANEL_EXIT_MS);
  }, [animateAction]);

  useFocusTrap(panelRef, isOpen && !isClosing, close, launcherRef);

  const open = useCallback(
    (nextMode: WidgetMode, nextPreset: AssistantPreset | null = null) => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      openRef.current = true;
      closingRef.current = false;
      restoreLauncherFocusRef.current = false;
      setHasOpened(true);
      setIsClosing(false);
      setTransitionDirection(nextMode === "calculator" ? "forward" : "backward");
      setMode(nextMode);
      setPreset(nextPreset);
      setIsOpen(true);
      track("widget_open", { mode: nextMode });
    },
    [],
  );

  const switchMode = useCallback(
    (nextMode: WidgetMode) => {
      if (nextMode === mode) return;
      setTransitionDirection(nextMode === "calculator" ? "forward" : "backward");
      setMode(nextMode);
      track("mode_switch", { to: nextMode });
    },
    [mode],
  );

  const beginSwipe = (
    event: ReactPointerEvent<HTMLElement>,
    ref: { current: SwipeStart | null },
    allowInteractive: boolean,
  ) => {
    if (!allowInteractive && isInteractiveSwipeTarget(event.target)) return;
    ref.current = { x: event.clientX, y: event.clientY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional.
    }
  };

  const finishSwipe = (
    event: ReactPointerEvent<HTMLElement>,
    ref: { current: SwipeStart | null },
    threshold: number,
  ) => {
    const start = ref.current;
    ref.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.15) {
      return;
    }

    if (mode === "assistant" && dx < 0) {
      switchMode("calculator");
    } else if (mode === "calculator" && dx > 0) {
      switchMode("assistant");
    }
  };

  const openFromOptions = useCallback(
    (options: OpenSiteAssistantOptions) => {
      const directPreset =
        options?.preset ?? (isPreset(options?.entry) ? options.entry : undefined);
      const calculatorEntry =
        options?.entry === "builder" ||
        options?.entry === "calculator" ||
        Boolean(directPreset);
      open(calculatorEntry ? "calculator" : "assistant", directPreset ?? null);
    },
    [open],
  );

  useEffect(() => installSiteAssistantGlobal(), []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const options = (event as CustomEvent<OpenSiteAssistantOptions>).detail;
      openFromOptions(options ?? { entry: "builder" });
    };

    window.addEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
  }, [openFromOptions]);

  useEffect(() => {
    if (!embedMode) return;
    return installEmbedBridge({ open: openFromOptions, close });
  }, [close, embedMode, openFromOptions]);

  useEffect(() => {
    if (embedMode) announceEmbedState(isOpen);
  }, [embedMode, isOpen]);

  useLayoutEffect(() => {
    if (isOpen || !restoreLauncherFocusRef.current) return;
    restoreLauncherFocusRef.current = false;
    launcherRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useLayoutEffect(() => {
    panelRef.current?.toggleAttribute("inert", isClosing || !isOpen);
  }, [hasOpened, isClosing, isOpen]);

  useLayoutEffect(() => {
    calculatorViewRef.current?.toggleAttribute("inert", mode !== "calculator");
    assistantViewRef.current?.toggleAttribute("inert", mode !== "assistant");
  }, [hasOpened, mode]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      clearActionTimer();
    },
    [clearActionTimer],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.assistantOpen = "true";
    return () => {
      delete document.documentElement.dataset.assistantOpen;
    };
  }, [isOpen]);

  const reset = () => {
    animateAction("reset");
    setPreset(null);
    setResetToken((value) => value + 1);
    track("widget_reset", { mode });
  };

  return (
    <div className="cw-widget">
      <div className="cw-launcher-dock">
        {/* Previous contract wording, not rendered: Vyskladajte si asistenta na počkanie. */}
        <div className="cw-launcher-preview" aria-hidden="true">
          <strong>Vyskladajte si riešenie na počkanie</strong>
          <span>Návrh máte do minúty.</span>
        </div>
        <button
          id="chameleon-widget-launcher"
          data-testid="widget-launcher"
          className="cw-launcher"
          ref={launcherRef}
          type="button"
          aria-label="Otvoriť Môj Chatbot"
          aria-expanded={isOpen}
          aria-controls="chameleon-widget-panel"
          onClick={() => open(mode, preset)}
        >
          <BubbleLogo size="launcher" />
        </button>
      </div>

      {hasOpened ? (
        <section
          id="chameleon-widget-panel"
          className="cw-panel"
          data-mode={mode}
          data-direction={transitionDirection}
          data-state={isClosing ? "closing" : "open"}
          hidden={!isOpen}
          aria-hidden={isClosing || !isOpen}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chameleon-widget-title"
          tabIndex={-1}
        >
          <header className="cw-panel-head">
            <span className="cw-panel-head__mascot" aria-hidden="true">
              <BubbleLogo size="header" />
            </span>
            <div className="cw-panel-head__title">
              <h2 id="chameleon-widget-title">Môj Chatbot</h2>
              <p className="cw-panel-head__online">
                <i aria-hidden="true" />
                Online
              </p>
            </div>
            <div className="cw-panel-head__actions">
              <button
                type="button"
                data-testid="widget-reset"
                data-action-animating={
                  actionAnimating === "reset" ? "reset" : undefined
                }
                aria-label="Začať odznova"
                title="Začať odznova"
                onClick={reset}
              >
                <WidgetIcon name="reset" />
              </button>
              <button
                type="button"
                className="cw-panel-head__close"
                data-testid="widget-close"
                data-action-animating={
                  actionAnimating === "close" ? "close" : undefined
                }
                aria-label="Zavrieť"
                title="Zavrieť"
                onClick={close}
              >
                <WidgetIcon name="close" />
              </button>
            </div>
          </header>

          <nav
            className="cw-tabs"
            aria-label="Výber časti"
            role="tablist"
            data-mode={mode}
            onPointerDown={(event) =>
              beginSwipe(event, tabSwipeStartRef, true)
            }
            onPointerUp={(event) =>
              finishSwipe(event, tabSwipeStartRef, SWIPE_THRESHOLD_PX)
            }
            onPointerCancel={() => {
              tabSwipeStartRef.current = null;
            }}
          >
            <span className="cw-tabs__thumb" aria-hidden="true" />
            <button
              id="cw-tab-assistant"
              type="button"
              role="tab"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-selected={mode === "assistant"}
              aria-controls="cw-panel-assistant"
              onClick={() => switchMode("assistant")}
            >
              <WidgetIcon name="chat" />
              <span>Chatbot</span>
            </button>
            <button
              id="cw-tab-calculator"
              type="button"
              role="tab"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-selected={mode === "calculator"}
              aria-controls="cw-panel-calculator"
              onClick={() => switchMode("calculator")}
            >
              <WidgetIcon name="calculator" />
              <span>Konfigurátor</span>
            </button>
          </nav>

          <div
            className="cw-panel-body"
            data-mode={mode}
            data-direction={transitionDirection}
            onPointerDown={(event) =>
              beginSwipe(event, bodySwipeStartRef, false)
            }
            onPointerUp={(event) =>
              finishSwipe(event, bodySwipeStartRef, BODY_SWIPE_THRESHOLD_PX)
            }
            onPointerCancel={() => {
              bodySwipeStartRef.current = null;
            }}
          >
            <div
              id="cw-panel-assistant"
              className="cw-mode-view"
              ref={assistantViewRef}
              role="tabpanel"
              aria-labelledby="cw-tab-assistant"
              data-view="assistant"
              data-active={mode === "assistant"}
              aria-hidden={mode !== "assistant"}
            >
              <AssistantConversation
                active={mode === "assistant"}
                resetToken={resetToken}
                onOpenCalculator={() => switchMode("calculator")}
              />
            </div>
            <div
              id="cw-panel-calculator"
              className="cw-mode-view"
              ref={calculatorViewRef}
              role="tabpanel"
              aria-labelledby="cw-tab-calculator"
              data-view="calculator"
              data-active={mode === "calculator"}
              aria-hidden={mode !== "calculator"}
            >
              <ToolCalculator
                active={mode === "calculator"}
                resetToken={resetToken}
                initialPreset={preset}
                onOpenChat={() => switchMode("assistant")}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
