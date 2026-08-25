import { createRoot } from "react-dom/client";
import { AssistantWidget } from "./components/widget/AssistantWidget";
import { LaunchReadyRuntime } from "./components/widget/LaunchReadyRuntime";
import { installConfiguratorAutoAdvance } from "./lib/configuratorAutoAdvance";
import "./widget.css";
import "./product-widget.css";
import "./widget-polish.css";
import "./launch-ready-styles";

installConfiguratorAutoAdvance();

const HOST_ID = "dv-assistant-root";
const scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src ?? "";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap";

/*
 * Inter Tight is the brand typeface — the same one mojchatbot.sk serves. The
 * chatbot used to adopt the host page's font instead, so it looked like a
 * different product on every site. If this request fails, the system font is
 * used and the layout still works.
 */
function ensureBrandFont(): void {
  if (document.querySelector(`link[data-dv-assistant-font="true"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  link.crossOrigin = "anonymous";
  link.dataset.dvAssistantFont = "true";
  document.head.appendChild(link);
}

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
  ensureBrandFont();

  const host = existing ?? document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-dv-assistant-version", "restored-web-palette-20260825-v2");
  host.setAttribute("data-dv-assistant-theme", "website-paper-forest-lime");
  host.setAttribute("data-dv-assistant-quality", "archived-layout-restrained-palette");

  if (!existing) document.body.appendChild(host);

  createRoot(host).render(
    <>
      <LaunchReadyRuntime />
      <AssistantWidget />
    </>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
