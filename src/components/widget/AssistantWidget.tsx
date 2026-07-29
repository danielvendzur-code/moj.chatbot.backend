import { useCallback, useEffect, useRef, useState } from "react";
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

const isPreset = (value: string | undefined): value is AssistantPreset =>
  Boolean(value && ["calculator", "inquiry", "advisor", "booking"].includes(value));

export function AssistantWidget({ embedMode = false }: AssistantWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("assistant");
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<AssistantPreset | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    track("widget_close");
  }, []);
  useFocusTrap(panelRef, isOpen, close);

  const open = useCallback(
    (nextMode: WidgetMode, nextPreset: AssistantPreset | null = null) => {
      setMode(nextMode);
      setPreset(nextPreset);
      setResetToken((value) => value + 1);
      setIsOpen(true);
      track("widget_open", { mode: nextMode });
    },
    [],
  );

  const switchMode = useCallback((nextMode: WidgetMode) => {
    setMode(nextMode);
    setPreset(null);
    track("mode_switch", { to: nextMode });
  }, []);

  /* The switch thumb can be dragged, not only tapped. */
  const startThumbDrag = (clientX: number) => {
    dragRef.current = { x: clientX, moved: false };
    tabsRef.current?.setAttribute("data-dragging", "true");
  };

  const moveThumbDrag = (clientX: number) => {
    const drag = dragRef.current;
    const tabs = tabsRef.current;
    const thumb = thumbRef.current;
    if (!drag || !tabs || !thumb) return;
    const travel = tabs.getBoundingClientRect().width / 2;
    if (travel <= 0) return;
    const base = mode === "assistant" ? travel : 0;
    const next = Math.max(0, Math.min(travel, base + (clientX - drag.x)));
    if (Math.abs(clientX - drag.x) > 3) drag.moved = true;
    thumb.style.transform = `translateX(${next}px)`;
  };

  const endThumbDrag = (clientX: number) => {
    const drag = dragRef.current;
    const tabs = tabsRef.current;
    const thumb = thumbRef.current;
    dragRef.current = null;
    tabs?.removeAttribute("data-dragging");
    if (thumb) thumb.style.transform = "";
    if (!drag || !tabs) return;
    if (!drag.moved) return;
    const travel = tabs.getBoundingClientRect().width / 2;
    const base = mode === "assistant" ? travel : 0;
    const next = base + (clientX - drag.x);
    switchMode(next > travel / 2 ? "assistant" : "calculator");
  };

  const openFromOptions = useCallback(
    (options: OpenSiteAssistantOptions) => {
      const directPreset = options?.preset ?? (isPreset(options?.entry) ? options.entry : undefined);
      const calculatorEntry =
        options?.entry === "builder" || options?.entry === "calculator" || Boolean(directPreset);
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
        type="button"
        aria-label="Otvoriť chat — spočítam cenu alebo odpoviem na otázky"
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
          data-mode={mode}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chameleon-widget-title"
          tabIndex={-1}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            if (dx < 0 && mode === "calculator") switchMode("assistant");
            else if (dx > 0 && mode === "assistant") switchMode("calculator");
          }}
        >
          <header className="cw-panel-head">
            <h2 id="chameleon-widget-title" className="cw-sr-only">
              Môj Chatbot — spočíta cenu a odpovie na otázky
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
              if (event.pointerType === "mouse" && event.button !== 0) return;
              startThumbDrag(event.clientX);
            }}
            onPointerMove={(event) => {
              if (dragRef.current) moveThumbDrag(event.clientX);
            }}
            onPointerUp={(event) => endThumbDrag(event.clientX)}
            onPointerCancel={(event) => endThumbDrag(event.clientX)}
          >
            <span className="cw-tabs__thumb" aria-hidden="true" ref={thumbRef} />
            <button
              type="button"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-pressed={mode === "calculator"}
              onClick={() => switchMode("calculator")}
            >
              <WidgetIcon name="calculator" />
              <span>Spočítať cenu</span>
            </button>
            <button
              type="button"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-pressed={mode === "assistant"}
              onClick={() => switchMode("assistant")}
            >
              <WidgetIcon name="chat" />
              <span>Napísať mi</span>
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
