/*
 * Ľahká analytika lievika. Udalosti sa vytvoria výhradne po explicitnom
 * analytickom súhlase hostiteľskej stránky. Bez stavu `granted` sa nič
 * nedispatchne ani nepridá do dataLayer.
 */

export const SITE_ASSISTANT_ANALYTICS_EVENT = "site-assistant:analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: string, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.documentElement.dataset.analyticsConsent !== "granted") return;

  const detail = { event, props, ts: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent(SITE_ASSISTANT_ANALYTICS_EVENT, { detail }));
  } catch {
    /* CustomEvent nemusí byť dostupný v starom prostredí — ticho preskočíme */
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: `dv_assistant_${event}`, ...props });
  }
}
