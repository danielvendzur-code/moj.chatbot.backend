import { AssistantWidget } from "./components/widget/AssistantWidget";
import { isEmbedMode } from "./lib/embedBridge";

export default function App(): JSX.Element {
  const embedMode = isEmbedMode();

  return (
    <main
      className="widget-preview"
      aria-label={embedMode ? "Môj Chatbot" : "Ukážka chatbota Môj Chatbot"}
    >
      {!embedMode ? <div className="widget-preview__surface" aria-hidden="true" /> : null}
      <AssistantWidget embedMode={embedMode} />
    </main>
  );
}
