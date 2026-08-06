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
import "../../liquid-glass-final.css";
import { AssistantConversation } from "./AssistantConversation";
import { BubbleLogo } from "./BubbleLogo";
import { ToolCalculator } from "./ToolCalculator";
import { WidgetIcon } from "./WidgetIcon";

type WidgetMode = "assistant" | "calculator";

type AssistantWidgetProps = {
  embedMode?: boolean;
};

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(
    value && ["calculator", "product", "inquiry", "advisor", "booking"].includes(value),
  );

const PANEL_EXIT_MS = 170;
const SWIPE_THRESHOLD_PX = 26;

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
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<AssistantPreset | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const calculatorViewRef = useRef<HTMLDivElement>(null);
  const assistantViewRef = useRef<HTMLDivElement>(null);
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
      setMode(nextMode);
      track("mode_switch", { to: nextMode });
    },
    [mode],
  );

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
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.assistantOpen = "true";
    return () => {
      delete document.documentElement.dataset.assistantOpen;
    };
  }, [isOpen]);

  const reset = () => {
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
            onPointerDown={(event) => {
              swipeStartRef.current = event.clientX;
            }}
            onPointerUp={(event) => {
              const start = swipeStartRef.current;
              swipeStartRef.current = null;
              if (start === null) return;
              const dx = event.clientX - start;
              if (dx > SWIPE_THRESHOLD_PX) switchMode("calculator");
              else if (dx < -SWIPE_THRESHOLD_PX) switchMode("assistant");
            }}
            onPointerCancel={() => {
              swipeStartRef.current = null;
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

          <div className="cw-panel-body">
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
