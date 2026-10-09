import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLauncherSurface } from "../../hooks/useLauncherSurface";
import { useMobilePanelViewport } from "../../hooks/useMobilePanelViewport";
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
type SwipeDirection = "forward" | "backward";

type AssistantWidgetProps = {
  embedMode?: boolean;
};

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(
    value &&
    ["calculator", "product", "inquiry", "advisor", "booking"].includes(value),
  );

const PANEL_EXIT_MS = 400;

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
  const [transitionDirection, setTransitionDirection] =
    useState<SwipeDirection>("forward");
  const resetToken = 0;
  const [preset, setPreset] = useState<AssistantPreset | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const launcherSurface = useLauncherSurface(launcherRef, isOpen);
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
  useMobilePanelViewport(panelRef, isOpen, embedMode);

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
      setTransitionDirection(
        nextMode === "calculator" ? "forward" : "backward",
      );
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
      setTransitionDirection(
        nextMode === "calculator" ? "forward" : "backward",
      );
      setMode(nextMode);
      track("mode_switch", { to: nextMode });
    },
    [mode],
  );

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
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  // Remove the document scroll lock in the layout phase, before the mobile
  // viewport hook restores the saved scroll position on the next frame.
  useLayoutEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.assistantOpen = "true";
    return () => {
      delete document.documentElement.dataset.assistantOpen;
    };
  }, [isOpen]);

  return (
    <div className="cw-widget" data-open={isOpen}>
      <div className="cw-launcher-dock">
        <button
          id="chameleon-widget-launcher"
          data-testid="widget-launcher"
          className="cw-launcher"
          data-surface={launcherSurface}
          ref={launcherRef}
          type="button"
          aria-label="Otvoriť Môj Chatbot"
          aria-expanded={isOpen}
          aria-controls="chameleon-widget-panel"
          onClick={() => open(mode, preset)}
        >
          <span className="cw-launcher-hint" aria-hidden="true">
            Ako môžeme pomôcť vášmu webu?
          </span>
          <BubbleLogo
            size="launcher"
            tone={launcherSurface === "dark" ? "brand" : "paper"}
          />
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

          <div
            className="cw-panel-body"
            data-mode={mode}
            data-direction={transitionDirection}
          >
            <div
              id="cw-panel-assistant"
              className="cw-mode-view"
              ref={assistantViewRef}
              role="region"
              aria-label="Konverzácia"
              data-view="assistant"
              data-active={mode === "assistant"}
              aria-hidden={mode !== "assistant"}
            >
              <AssistantConversation
                active={isOpen && !isClosing && mode === "assistant"}
                resetToken={resetToken}
                onOpenBuilder={() => switchMode("calculator")}
              />
            </div>
            <div
              id="cw-panel-calculator"
              className="cw-mode-view"
              ref={calculatorViewRef}
              role="region"
              aria-label="Konfigurátor riešenia"
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
