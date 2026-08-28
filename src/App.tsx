import { AssistantWidget } from "./components/widget/AssistantWidget";
import { LaunchReadyRuntime } from "./components/widget/LaunchReadyRuntime";
import { isEmbedMode } from "./lib/embedBridge";
import "./smooth-logo-final.css";
import "./launch-ready-final.css";
import "./solid-widget-final.css";
import "./dark-chip-final.css";
import "./goal-lock-final.css";
import "./interaction-stability-final.css";
import "./restored-widget-palette.css";
import "./premium-motion-system.css";
import "./requested-august-widget.css";
import "./contact-chip-glow-final.css";
import "./logo-match-final.css";
import "./selection-indicator-authority.css";

export default function App(): JSX.Element {
  const embedMode = isEmbedMode();

  return (
    <main
      className="widget-preview"
      aria-label={embedMode ? "AI Assistant" : "Ukážka AI Assistanta"}
    >
      {!embedMode ? (
        <div className="widget-preview__surface" aria-hidden="true" />
      ) : null}
      <LaunchReadyRuntime />
      <AssistantWidget embedMode={embedMode} />
    </main>
  );
}
