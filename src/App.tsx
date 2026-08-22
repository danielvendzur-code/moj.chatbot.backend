import { AssistantWidget } from "./components/widget/AssistantWidget";
import { LaunchReadyRuntime } from "./components/widget/LaunchReadyRuntime";
import { isEmbedMode } from "./lib/embedBridge";
import "./smooth-logo-final.css";
import "./launch-ready-final.css";
import "./solid-widget-final.css";
import "./dark-chip-final.css";
import "./logo-match-final.css";
import "./goal-lock-final.css";
import "./interaction-stability-final.css";
import "./website-match-final.css";
import "./website-match-kage-final.css";

export default function App(): JSX.Element {
  const embedMode = isEmbedMode();

  return (
    <main
      className="widget-preview"
      aria-label={embedMode ? "AI Assistant" : "Ukážka AI Assistanta"}
    >
      {!embedMode ? <div className="widget-preview__surface" aria-hidden="true" /> : null}
      <LaunchReadyRuntime />
      <AssistantWidget embedMode={embedMode} />
    </main>
  );
}
