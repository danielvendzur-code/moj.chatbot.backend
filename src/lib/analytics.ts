/*
 * Ľahká analytika lievika. Bez závislostí — udalosti len dispatchne ako
 * CustomEvent (rovnaká konvencia ako siteAssistant.ts) a ak je na stránke
 * GA4 (window.dataLayer), pushne ich aj tam. Hostiteľský web si ich vie
 * odchytiť a poslať kam potrebuje.
 */

export const SITE_ASSISTANT_ANALYTICS_EVENT = "site-assistant:analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: string, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;

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
