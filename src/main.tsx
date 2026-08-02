import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installConfiguratorAutoAdvance } from "./lib/configuratorAutoAdvance";
import { installPremiumTilt } from "./lib/premiumTilt";
import { getInitialEmbedViewport, isEmbedMode } from "./lib/embedBridge";
import "./preview.css";
import "./widget.css";
import "./assistant-redesign.css";
import "./approved-submit-final.css";
import "./final-user-correction.css";
import "./green-motion-final.css";
import "./unified-experience-final.css";
import "./masterpiece-final.css";
import "./lime-white-widget-final.css";

installConfiguratorAutoAdvance();
installPremiumTilt();

if (isEmbedMode()) {
  document.documentElement.dataset.embed = "true";
  document.documentElement.dataset.embedViewport = getInitialEmbedViewport();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
