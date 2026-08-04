import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installConfiguratorAutoAdvance } from "./lib/configuratorAutoAdvance";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import { installProductRefinement } from "./lib/installProductRefinement";
import "./preview.css";
import "./widget.css";
import "./product-widget.css";

installConfiguratorAutoAdvance();
installProductRefinement();

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
