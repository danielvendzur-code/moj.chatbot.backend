import {
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
import { AssistantConversation } from "./AssistantConversation";
import { BubbleLogo } from "./BubbleLogo";
import { ToolCalculator } from "./ToolCalculator";
import { WidgetIcon } from "./WidgetIcon";

type WidgetMode = "assistant" | "calculator";

type ThumbDrag = {
  pointerId: number;
  x: number;
  moved: boolean;
};

type AssistantWidgetProps = {
  embedMode?: boolean;
};

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(
    value && ["calculator", "inquiry", "advisor", "booking"].includes(value),
  );

const PANEL_EXIT_MS = 210;

const reducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AssistantWidget({
  embedMode = false,
}: AssistantWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("assistant");
  const [modeDirection, setModeDirection] = useState<"forward" | "backward">(
    "forward",
  );
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<AssistantPreset | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const calculatorViewRef = useRef<HTMLDivElement>(null);
  const assistantViewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ThumbDrag | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const restoreLauncherFocusRef = useRef(false);

  const close = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
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
  }, []);
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
      setModeDirection(nextMode === "assistant" ? "forward" : "backward");
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
      setModeDirection(nextMode === "assistant" ? "forward" : "backward");
      setMode(nextMode);
      track("mode_switch", { to: nextMode });
    },
    [mode],
  );

  /* The switch thumb can be dragged, not only tapped. */
  const startThumbDrag = (
    pointerId: number,
    clientX: number,
    tabs: HTMLElement,
  ) => {
    dragRef.current = { pointerId, x: clientX, moved: false };
    tabs.dataset.dragging = "true";
    tabs.setPointerCapture?.(pointerId);
  };

  const moveThumbDrag = (pointerId: number, clientX: number) => {
    const drag = dragRef.current;
    const tabs = tabsRef.current;
    const thumb = thumbRef.current;
    if (!drag || drag.pointerId !== pointerId || !tabs || !thumb) return;
    const travel = tabs.getBoundingClientRect().width / 2;
    if (travel <= 0) return;
    const base = mode === "assistant" ? travel : 0;
    const next = Math.max(0, Math.min(travel, base + (clientX - drag.x)));
    if (Math.abs(clientX - drag.x) > 6) drag.moved = true;
    thumb.style.transform = `translateX(${next}px)`;
  };

  const endThumbDrag = (
    pointerId: number,
    clientX: number,
    commit: boolean,
  ) => {
    const drag = dragRef.current;
    const tabs = tabsRef.current;
    const thumb = thumbRef.current;
    if (!drag || drag.pointerId !== pointerId) return;
    dragRef.current = null;
    tabs?.removeAttribute("data-dragging");
    if (thumb) thumb.style.transform = "";
    if (tabs?.hasPointerCapture?.(pointerId))
      tabs.releasePointerCapture(pointerId);
    if (!tabs || !drag.moved) return;

    suppressClickRef.current = true;
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = null;
    }, 0);

    if (!commit) return;
    const travel = tabs.getBoundingClientRect().width / 2;
    const base = mode === "assistant" ? travel : 0;
    const next = base + (clientX - drag.x);
    switchMode(next > travel / 2 ? "assistant" : "calculator");
  };

  const clickMode = (nextMode: WidgetMode) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    switchMode(nextMode);
  };

  const openFromOptions = useCallback(
    (options: OpenSiteAssistantOptions) => {
      const directPreset =
        options?.preset ??
        (isPreset(options?.entry) ? options.entry : undefined);
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
      if (closeTimerRef.current !== null)
        window.clearTimeout(closeTimerRef.current);
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    [],
  );

  /* The panel used to set `overflow: hidden` on <body> while open. That makes
     the body the scroll container, which breaks page scrolling and pinch-zoom
     on mobile as soon as the keyboard opens. The panel is `position: fixed` and
     stops touch scroll from reaching the page via `overscroll-behavior`, so no
     lock on <body> is needed at all. A data flag stays available for hosts that
     want to react to the open panel. */
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.assistantOpen = "true";
    return () => {
      delete document.documentElement.dataset.assistantOpen;
    };
  }, [isOpen]);

  return (
    <div className="cw-widget">
      <button
        id="chameleon-widget-launcher"
        data-testid="widget-launcher"
        className="cw-launcher"
        ref={launcherRef}
        type="button"
        aria-label="Otvoriť chat — navrhnem riešenie alebo odpoviem na otázky"
        aria-expanded={isOpen}
        aria-controls="chameleon-widget-panel"
        onClick={() => open(mode, preset)}
      >
        <BubbleLogo size="launcher" />
      </button>

      {hasOpened ? (
        <section
          id="chameleon-widget-panel"
          className="cw-panel"
          data-mode={mode}
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
            <h2 id="chameleon-widget-title" className="cw-sr-only">
              Môj Chatbot — navrhne riešenie a odpovie na otázky
            </h2>
            <span className="cw-panel-head__mascot">
              <BubbleLogo size="header" />
            </span>
            <div className="cw-panel-head__title">
              <b>Môj Chatbot</b>
              <span className="cw-panel-head__context cw-panel-head__online">
                <i aria-hidden="true" /> Online
              </span>
            </div>
            <div className="cw-panel-head__actions">
              <button
                type="button"
                data-testid="widget-reset"
                aria-label="Začať odznova"
                title="Začať odznova"
                onClick={() => {
                  setPreset(null);
                  setResetToken((value) => value + 1);
                }}
              >
                <WidgetIcon name="reset" />
              </button>
              <button
                type="button"
                className="cw-panel-head__close"
                data-testid="widget-close"
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
            aria-label="Vyberte si, ako vám mám pomôcť"
            data-mode={mode}
            ref={tabsRef}
            onPointerDown={(event) => {
              if (
                !event.isPrimary ||
                (event.pointerType === "mouse" && event.button !== 0)
              ) {
                return;
              }
              startThumbDrag(
                event.pointerId,
                event.clientX,
                event.currentTarget,
              );
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              moveThumbDrag(event.pointerId, event.clientX);
              if (dragRef.current?.moved) event.preventDefault();
            }}
            onPointerUp={(event) =>
              endThumbDrag(event.pointerId, event.clientX, true)
            }
            onPointerCancel={(event) =>
              endThumbDrag(event.pointerId, event.clientX, false)
            }
            onLostPointerCapture={(event) => {
              const drag = dragRef.current;
              if (drag?.pointerId === event.pointerId) {
                endThumbDrag(event.pointerId, drag.x, false);
              }
            }}
          >
            <span
              className="cw-tabs__thumb"
              aria-hidden="true"
              ref={thumbRef}
            />
            <button
              type="button"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-pressed={mode === "calculator"}
              onClick={() => clickMode("calculator")}
            >
              <WidgetIcon name="calculator" />
              <span>Vyskladať riešenie</span>
            </button>
            <button
              type="button"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-pressed={mode === "assistant"}
              onClick={() => clickMode("assistant")}
            >
              <WidgetIcon name="chat" />
              <span>Napísať mi</span>
            </button>
          </nav>

          <div className="cw-panel-body" data-direction={modeDirection}>
            <div
              className="cw-mode-view"
              ref={calculatorViewRef}
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
            <div
              className="cw-mode-view"
              ref={assistantViewRef}
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
