import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import { installLiquidSegmentedDrag } from "./lib/liquidSegmentedDrag";
import { installWidgetRailDrag } from "./lib/widgetRailDrag";
import { installWidgetSpotlight } from "./lib/widgetSpotlight";
import "./widget.css";
import "./interaction.css";
import "./requested-polish.css";
import "./world-class-polish.css";
import "./competition-widget.css";
import "./flow-content-polish.css";
import "./black-blue-refresh.css";
import "./premium-liquid-final.css";
import "./chip-refinement-final.css";
import "./apple-liquid-fixes.css";
import "./apple-liquid-system-final.css";
import "./restrained-widget-final.css";
import "./derat-layout-final.css";
import "./owner-friendly-final.css";
import "./competition-winner-final.css";
import "./taste-system-final.css";

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

installWidgetRailDrag();
installLiquidSegmentedDrag();
installWidgetSpotlight();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
