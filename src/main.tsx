import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import { installWidgetSpotlight } from "./lib/widgetSpotlight";
import "./widget.css";
import "./assistant-redesign.css";
import "./approved-submit-final.css";

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

installWidgetSpotlight();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
