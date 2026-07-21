import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import { installWidgetRailDrag } from "./lib/widgetRailDrag";
import "./widget.css";
import "./interaction.css";
import "./polish.css";

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

installWidgetRailDrag();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
