import { useCallback, useEffect, useRef, useState } from "react";
import { useFlyCatch } from "../../hooks/useFlyCatch";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  installSiteAssistantGlobal,
  SITE_ASSISTANT_OPEN_EVENT,
} from "../../lib/siteAssistant";
import type { GoalId, OpenSiteAssistantOptions } from "../../types/assistant";
import { AssistantConversation } from "./AssistantConversation";
import { ChameleonSprite } from "./ChameleonSprite";
import { ToolCalculator } from "./ToolCalculator";
import { WidgetIcon } from "./WidgetIcon";

type WidgetMode = "assistant" | "calculator";

const isGoalPreset = (value: string | undefined): value is Exclude<GoalId, "combined"> =>
  Boolean(value && ["calculator", "inquiry", "advisor", "booking"].includes(value));

export function ChameleonWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>("assistant");
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [preset, setPreset] = useState<GoalId | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { phase, trigger } = useFlyCatch();

  const close = useCallback(() => setIsOpen(false), []);
  useFocusTrap(panelRef, isOpen, close);

  const open = useCallback((nextMode: WidgetMode, nextPreset: GoalId | null = null) => {
    setMode(nextMode);
    setPreset(nextPreset);
    setResetToken((value) => value + 1);
    setTeaserVisible(false);
    setIsOpen(true);
  }, []);

  useEffect(() => installSiteAssistantGlobal(), []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const options = (event as CustomEvent<OpenSiteAssistantOptions>).detail;
      const directPreset = options?.preset ?? (isGoalPreset(options?.entry) ? options.entry : undefined);
      const calculatorEntry = options?.entry === "builder" || options?.entry === "calculator" || Boolean(directPreset);
      open(calculatorEntry ? "calculator" : "assistant", directPreset ?? null);
    };

    window.addEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SITE_ASSISTANT_OPEN_EVENT, onOpen);
  }, [open]);

  useEffect(() => {
    if (teaserDismissed || isOpen) return;
    const timer = window.setTimeout(() => setTeaserVisible(true), 1_100);
    return () => window.clearTimeout(timer);
  }, [isOpen, teaserDismissed]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 520px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <div className="cw-widget" data-phase={phase}>
      {teaserVisible && !isOpen ? (
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
            <strong>Zistite, čo by fungovalo na vašom webe</strong>
            <span>
              Otvorte <b>kalkulačku návrhu</b> — základ máte do minúty. <b>AI asistent</b> poradí ďalší krok.
            </span>
          </button>
        </aside>
      ) : null}

      <button
        id="chameleon-widget-launcher"
        data-testid="widget-launcher"
        className="cw-launcher"
        type="button"
        aria-label="Otvoriť Chameleon AI asistenta"
        aria-expanded={isOpen}
        aria-controls="chameleon-widget-panel"
        onMouseEnter={trigger}
        onFocus={trigger}
        onClick={() => open("assistant")}
      >
        <ChameleonSprite phase={phase} size="launcher" />
        <span className="cw-launcher__online" aria-hidden="true" />
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
            <span className="cw-panel-head__mascot"><ChameleonSprite phase={phase} size="header" /></span>
            <div className="cw-panel-head__title">
              <b id="chameleon-widget-title">{mode === "assistant" ? "Chameleon AI" : "Kalkulačka návrhu"}</b>
              <span><i /> Online · lokálna ukážka</span>
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
          </header>

          <nav className="cw-tabs" aria-label="Režim asistenta">
            <button
              type="button"
              data-testid="tab-calculator"
              data-active={mode === "calculator"}
              aria-current={mode === "calculator" ? "page" : undefined}
              onClick={() => setMode("calculator")}
            >
              <WidgetIcon name="calculator" /> Kalkulačka
            </button>
            <button
              type="button"
              data-testid="tab-assistant"
              data-active={mode === "assistant"}
              aria-current={mode === "assistant" ? "page" : undefined}
              onClick={() => setMode("assistant")}
            >
              <WidgetIcon name="chat" /> AI asistent
            </button>
          </nav>

          <div className="cw-panel-body">
            {mode === "assistant" ? (
              <AssistantConversation
                phase={phase}
                resetToken={resetToken}
                onOpenCalculator={() => setMode("calculator")}
              />
            ) : (
              <ToolCalculator resetToken={resetToken} initialGoal={preset} />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
