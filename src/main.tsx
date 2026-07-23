import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import { installLiquidSegmentedDrag } from "./lib/liquidSegmentedDrag";
import { installWidgetRailDrag } from "./lib/widgetRailDrag";
import "./widget.css";
import "./interaction.css";
import "./requested-polish.css";
import "./world-class-polish.css";
import "./competition-widget.css";
import "./flow-content-polish.css";
import "./black-blue-refresh.css";
import "./premium-liquid-final.css";
import "./chip-refinement-final.css";

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

installWidgetRailDrag();
installLiquidSegmentedDrag();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
