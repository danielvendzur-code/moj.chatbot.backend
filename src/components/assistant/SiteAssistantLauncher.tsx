import { useSiteAssistant } from "../../context/SiteAssistantContext";
import { ChameleonLauncherCompanion } from "./ChameleonLauncherCompanion";
import { MascotSpeechPrompt } from "./MascotSpeechPrompt";

export function SiteAssistantLauncher(): JSX.Element | null {
  const {
    isOpen,
    blocked,
    launcherReady,
    promptVisible,
    flyVisible,
    chameleonState,
    open,
    dismissPrompt,
  } = useSiteAssistant();

  if (blocked || isOpen) return null;

  const openBuilder = () => open({ entry: "builder" });

  return (
    <div className="assistant-launcher-shell" data-companion-ready={launcherReady}>
      <MascotSpeechPrompt
        visible={promptVisible}
        onOpen={openBuilder}
        onDismiss={dismissPrompt}
      />
      {launcherReady ? (
        <ChameleonLauncherCompanion state={chameleonState} flyVisible={flyVisible} />
      ) : null}
      <button
        id="site-assistant-launcher"
        data-testid="assistant-launcher"
        className="assistant-launcher"
        type="button"
        onClick={openBuilder}
        aria-label="Otvoriť asistenta a nájsť vhodné riešenie"
        aria-expanded="false"
        aria-controls="site-assistant-panel"
      >
        <span className="assistant-launcher__glyph" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="assistant-launcher__label">Nájsť vhodné riešenie</span>
        <span className="assistant-launcher__arrow" aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
