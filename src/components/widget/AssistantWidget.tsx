import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  installSiteAssistantGlobal,
  SITE_ASSISTANT_OPEN_EVENT,
} from "../../lib/siteAssistant";
import { announceEmbedState, installEmbedBridge } from "../../lib/embedBridge";
import { track } from "../../lib/analytics";
import type { AssistantPreset, OpenSiteAssistantOptions } from "../../types/assistant";
import { AssistantConversation } from "./AssistantConversation";
import { BubbleLogo } from "./BubbleLogo";
import { ToolCalculator } from "./ToolCalculator";
import { WidgetIcon } from "./WidgetIcon";

type WidgetMode = "assistant" | "calculator";

type AssistantWidgetProps = {
  embedMode?: boolean;
};

type TabDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  dragged: boolean;
};

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(value && ["calculator", "inquiry", "advisor", "booking"].includes(value));

export function AssistantWidget({ embedMode = false }: AssistantWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("assistant");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<AssistantPreset | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tabDragRef = useRef<TabDragState | null>(null);
  const suppressTabClickRef = useRef(false);

  const close = useCallback(() => {
    setIsOpen(false);
    track("widget_close");
  }, []);
  useFocusTrap(panelRef, isOpen, close);

  const open = useCallback((nextMode: WidgetMode, nextPreset: AssistantPreset | null = null) => {
    setMode(nextMode);
    setPreset(nextPreset);
    setResetToken((value) => value + 1);
    setTeaserVisible(false);
    setIsOpen(true);
    track("widget_open", { mode: nextMode });
  }, []);

  const switchMode = useCallback((nextMode: WidgetMode) => {
    setMode(nextMode);
    track("mode_switch", { to: nextMode });
  }, []);

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

  const handleTabPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    tabDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragged: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleTabPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = tabDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.dragged) {
      if (Math.abs(deltaX) <= 7 || Math.abs(deltaX) <= Math.abs(deltaY) + 2) return;
      drag.dragged = true;
    }

    event.preventDefault();
  }, []);

  const handleTabPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = tabDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (drag.dragged) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const nextMode: WidgetMode =
          event.clientX < bounds.left + bounds.width / 2 ? "calculator" : "assistant";
        suppressTabClickRef.current = true;
        switchMode(nextMode);
        window.setTimeout(() => {
          suppressTabClickRef.current = false;
        }, 120);
      }

      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      tabDragRef.current = null;
    },
    [switchMode],
  );

  const handleTabPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    tabDragRef.current = null;
  }, []);

  const handleTabClick = useCallback(
    (nextMode: WidgetMode) => {
      if (suppressTabClickRef.current) return;
      switchMode(nextMode);
    },
    [switchMode],
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

  useEffect(() => {
    if (embedMode || teaserDismissed || isOpen) return;

    const showTimer = window.setTimeout(() => setTeaserVisible(true), 3_000);
    const hideTimer = window.setTimeout(() => setTeaserVisible(false), 11_500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [embedMode, isOpen, teaserDismissed]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 520px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <div className="cw-widget">
      {!embedMode && teaserVisible && !isOpen ? (
        <aside className="cw-teaser" data-testid="widget-teaser">
          <button
            type="button"
            className="cw-teaser__close"
            aria-label="Zavrieť tip"
            onClick={() => {
              setTeaserVisible(false);
              setTeaserDismissed(true);
            }}
          >
            ×
          </button>
          <button type="button" className="cw-teaser__content" onClick={() => open("calculator")}>
            <strong>Čo by pomohlo vášmu webu?</strong>
            <span className="cw-teaser__copy">
              Za minútu zistíte, aké riešenie dáva pre váš web zmysel.
            </span>
          </button>
        </aside>
      ) : null}

      <button
        id="chameleon-widget-launcher"
        data-testid="widget-launcher"
        className="cw-launcher"
        type="button"
        aria-label="Otvoriť webového asistenta"
        aria-expanded={isOpen}
        aria-controls="chameleon-widget-panel"
        onClick={() => open("assistant")}
      >
        <BubbleLogo size="launcher" />
      </button>

      {isOpen ? (
        <section
          id="chameleon-widget-panel"
          className="cw-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chameleon-widget-title"
          tabIndex={-1}
        >
          <header className="cw-panel-head">
            <h2 id="chameleon-widget-title" className="cw-sr-only">
              Webový asistent a konfigurátor
            </h2>
            <span className="cw-panel-head__mascot">
              <BubbleLogo size="header" />
            </span>
            <div className="cw-panel-head__title">
              <b>{mode === "assistant" ? "Poradiť sa" : "Vyskladať riešenie"}</b>
              <span className="cw-panel-head__context">
                {mode === "assistant" ? "Napíšte, s čím pomôcť" : "Krok za krokom k návrhu"}
              </span>
            </div>
            <div className="cw-panel-head__actions">
              <button
                type="button"
                data-testid="widget-reset"
                aria-label="Resetovať aktuálnu obrazovku"
                title="Resetovať"
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
                aria-label="Zavrieť asistenta"
                title="Zavrieť"
                onClick={close}
              >
                <WidgetIcon name="close" />
              </button>
            </div>
            <span className="cw-panel-head__beam" aria-hidden="true" />
          </header>

          <nav
            className="cw-tabs"
            aria-label="Režim asistenta"
            data-mode={mode}
            onPointerDown={handleTabPointerDown}
            onPointerMove={handleTabPointerMove}
            onPointerUp={handleTabPointerUp}
            onPointerCancel={handleTabPointerCancel}
          >
            <span className="cw-tabs__glass" aria-hidden="true" />
            <button
              type="button"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-current={mode === "calculator" ? "page" : undefined}
              onClick={() => handleTabClick("calculator")}
            >
              Vyskladať riešenie
            </button>
            <button
              type="button"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-current={mode === "assistant" ? "page" : undefined}
              onClick={() => handleTabClick("assistant")}
            >
              Poradiť sa
            </button>
          </nav>

          <div className="cw-panel-body" key={mode}>
            {mode === "assistant" ? (
              <AssistantConversation
                resetToken={resetToken}
                onOpenCalculator={() => switchMode("calculator")}
              />
            ) : (
              <ToolCalculator
                resetToken={resetToken}
                initialPreset={preset}
                onOpenChat={() => switchMode("assistant")}
              />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
