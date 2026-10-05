import "./launch-ready-styles";
import { createRoot } from "react-dom/client";
import { AssistantWidget } from "./components/widget/AssistantWidget";

import { installConfiguratorAutoAdvance } from "./lib/configuratorAutoAdvance";

installConfiguratorAutoAdvance();

const HOST_ID = "dv-assistant-root";
const scriptSrc =
  (document.currentScript as HTMLScriptElement | null)?.src ?? "";

// Same self-hosted Geist as the website, resolved relative to the stable loader.
function ensureBrandFont(): void {
  if (
    !scriptSrc ||
    document.querySelector('link[data-dv-assistant-font="true"]')
  )
    return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("fonts/brand.css", scriptSrc).toString();
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
  host.setAttribute("data-dv-assistant-version", "editorial-20261005-v18");
  host.setAttribute("data-dv-assistant-theme", "espresso-caramel");
  host.setAttribute(
    "data-dv-assistant-quality",
    "responsive-tool-combinations",
  );

  if (!existing) document.body.appendChild(host);

  createRoot(host).render(
    <>
      <AssistantWidget />
    </>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
