import { createRoot } from "react-dom/client";
import { AssistantWidget } from "./components/widget/AssistantWidget";
import "./widget.css";
import "./interaction.css";
import "./requested-polish.css";
import "./world-class-polish.css";
import "./competition-widget.css";
import "./flow-content-polish.css";
import "./black-blue-refresh.css";
import "./premium-liquid-final.css";

const HOST_ID = "dv-assistant-root";
const scriptSrc =
  (document.currentScript as HTMLScriptElement | null)?.src ?? "";

function ensureStylesheet(): void {
  if (!scriptSrc) return;
  const href = scriptSrc.replace(/widget\.js(\?.*)?$/, "widget.css$1");
  if (href === scriptSrc) return;
  if (document.querySelector(`link[data-dv-assistant-styles="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.crossOrigin = "anonymous";
  link.referrerPolicy = "strict-origin-when-cross-origin";
  link.dataset.dvAssistantStyles = "true";
  document.head.appendChild(link);
}

function mount(): void {
  const existing = document.getElementById(HOST_ID);
  if (existing?.childElementCount) return;

  ensureStylesheet();
  const host = existing ?? document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-dv-assistant-version", "ai-assistant-liquid-20260723");

  const siteFont = window.getComputedStyle(document.body).fontFamily;
  if (siteFont) host.style.setProperty("--cw-font", siteFont);
  if (!existing) document.body.appendChild(host);

  createRoot(host).render(<AssistantWidget />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
