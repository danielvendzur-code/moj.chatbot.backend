import type { OpenSiteAssistantOptions } from "../types/assistant";

export const SITE_ASSISTANT_OPEN_EVENT = "site-assistant:open";
export const SITE_OVERLAY_EVENT = "site:overlay-change";

export function openSiteAssistant(options: OpenSiteAssistantOptions): void {
  window.dispatchEvent(
    new CustomEvent<OpenSiteAssistantOptions>(SITE_ASSISTANT_OPEN_EVENT, {
      detail: options,
    }),
  );
}
export function installSiteAssistantGlobal(): () => void {
  window.openSiteAssistant = openSiteAssistant;

  return () => {
    if (window.openSiteAssistant === openSiteAssistant) {
      delete (window as Partial<Window>).openSiteAssistant;
    }
  };
}

export function setSiteOverlayOpen(open: boolean): void {
  if (open) document.body.dataset.siteOverlayOpen = "true";
  else delete document.body.dataset.siteOverlayOpen;
  window.dispatchEvent(new CustomEvent(SITE_OVERLAY_EVENT, { detail: { open } }));
}
