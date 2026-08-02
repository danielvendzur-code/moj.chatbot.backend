/* One origin list for every endpoint.

   These lived separately in api/chat.ts and api/lead.ts, and they drifted:
   mojchatbot.sk was added to the lead list and not the chat one, so on the
   production site the configurator submitted fine while every chat request
   came back 403. The widget answers a 403 with its offline fallback text, so
   the bot looked like it was replying badly rather than being blocked —
   which is a hard failure to spot from the outside.

   Shared here so adding a domain is one edit that cannot half-apply. */
export const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://danielvendzur-code.github.io",
  "https://moj-chatbot-backend.vercel.app",
  "https://vne-n.vercel.app",
  "https://mojchatbot.sk",
  "https://www.mojchatbot.sk",
]);

export function requestOrigin(headers: {
  origin?: string | string[] | undefined;
}): string | null {
  const raw = headers.origin;
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
}

/* ALLOWED_ORIGINS lets a new domain be added from Vercel without a deploy. */
export function configuredOrigins(): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  for (const value of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = value.trim();
    if (trimmed) origins.add(trimmed.replace(/\/$/, ""));
  }
  return origins;
}

export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const normalized = new URL(origin).origin;
    if (/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(normalized)) {
      return normalized;
    }
    return configuredOrigins().has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
