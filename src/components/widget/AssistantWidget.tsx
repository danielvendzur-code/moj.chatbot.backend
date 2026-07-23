import { useCallback, useEffect, useRef, useState } from "react";
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
    if (!isOpen || !window.matchMedia("(max-width: 520px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <div className="cw-widget">
      <button
        id="chameleon-widget-launcher"
        data-testid="widget-launcher"
        className="cw-launcher"
        type="button"
        aria-label="Otvoriť AI Assistanta"
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
        >
          <header className="cw-panel-head">
            <h2 id="chameleon-widget-title" className="cw-sr-only">
              AI Assistant a konfigurátor riešenia
            </h2>
            <span className="cw-panel-head__mascot">
              <BubbleLogo size="header" />
            </span>
            <div className="cw-panel-head__title">
              <b>AI Assistant</b>
              <span className="cw-panel-head__context cw-panel-head__online">
                <i aria-hidden="true" /> Online · odpoviem hneď
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

          <nav className="cw-tabs" aria-label="Režim asistenta" data-mode={mode}>
            <span className="cw-tabs__glass" aria-hidden="true" />
            <button
              type="button"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-current={mode === "calculator" ? "page" : undefined}
              onClick={() => switchMode("calculator")}
            >
              <WidgetIcon name="calculator" />
              <span>Vyskladať riešenie</span>
            </button>
            <button
              type="button"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-current={mode === "assistant" ? "page" : undefined}
              onClick={() => switchMode("assistant")}
            >
              <WidgetIcon name="chat" />
              <span>Poradiť sa</span>
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
