import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installConfiguratorAutoAdvance } from "./lib/configuratorAutoAdvance";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import "./widget.css";
import "./assistant-redesign.css";
import "./approved-submit-final.css";
import "./final-user-correction.css";

installConfiguratorAutoAdvance();

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
