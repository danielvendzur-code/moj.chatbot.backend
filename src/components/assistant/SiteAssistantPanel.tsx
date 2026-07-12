import { useCallback, useRef } from "react";
import { useSiteAssistant } from "../../context/SiteAssistantContext";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { AssistantFlow } from "./AssistantFlow";
import { ChameleonInsideAssistant } from "./ChameleonInsideAssistant";

export function SiteAssistantPanel(): JSX.Element | null {
  const {
    isOpen,
    close,
    minimize,
    chameleonState,
    flyVisible,
  } = useSiteAssistant();
  const panelRef = useRef<HTMLElement>(null);
  const handleEscape = useCallback(() => close(), [close]);
  useFocusTrap(panelRef, isOpen, handleEscape);

  if (!isOpen) return null;

  return (
    <div className="assistant-layer">
      <button
        className="assistant-scrim"
        type="button"
        aria-label="Minimalizovať asistenta"
        onClick={minimize}
      />
      <aside
        id="site-assistant-panel"
        className="assistant-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-assistant-title"
        tabIndex={-1}
      >
        <header className="assistant-panel__header">
          <ChameleonInsideAssistant state={chameleonState} flyVisible={flyVisible} />
          <div className="assistant-panel__title">
            <span>Interaktívny návrh</span>
            <h2 id="site-assistant-title">Nájdime vhodné riešenie</h2>
          </div>
          <div className="assistant-panel__controls">
            <button data-testid="assistant-minimize" type="button" onClick={minimize} aria-label="Minimalizovať asistenta" title="Minimalizovať">
              <span aria-hidden="true">—</span>
            </button>
            <button data-testid="assistant-close" type="button" onClick={close} aria-label="Zavrieť asistenta" title="Zavrieť">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </header>
        <AssistantFlow />
      </aside>
    </div>
  );
}
