import { createRoot } from "react-dom/client";
import { AssistantWidget } from "./components/widget/AssistantWidget";
import "./widget.css";
import "./widget-upgrade.css";

/*
 * Vložiteľný widget — jeden riadok na webe:
 *   <script src="https://danielvendzur-code.github.io/moj.chatbot.backend/widget.js" defer></script>
 *
 * Skript si sám pripojí widget.css (leží vedľa neho), vytvorí koreňový
 * element a prevezme font hostiteľskej stránky, takže widget vyzerá
 * ako súčasť webu.
 */

const HOST_ID = "dv-assistant-root";

/* document.currentScript treba prečítať synchrónne pri vyhodnotení */
const scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src ?? "";

function ensureStylesheet(): void {
  if (!scriptSrc) return;
  const href = scriptSrc.replace(/widget\.js(\?.*)?$/, "widget.css");
  if (href === scriptSrc) return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function mount(): void {
  if (document.getElementById(HOST_ID)) return;
  ensureStylesheet();

  const host = document.createElement("div");
  host.id = HOST_ID;
  /* font presne ako na webe — prevezmeme ho z hostiteľskej stránky */
  const siteFont = window.getComputedStyle(document.body).fontFamily;
  if (siteFont) host.style.setProperty("--cw-font", siteFont);
  document.body.appendChild(host);

  createRoot(host).render(<AssistantWidget />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
