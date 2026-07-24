import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_BODY_BYTES = 28_000;
const RATE_WINDOW_MS = 15 * 60 * 1_000;
const RATE_MAX_REQUESTS = 8;
const RECIPIENT = process.env.LEAD_TO_EMAIL || "daniel@vendzur.sk";

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://danielvendzur-code.github.io",
  "https://moj-chatbot-backend.vercel.app",
]);

type RateState = { count: number; resetAt: number };
type GlobalRateStore = typeof globalThis & {
  __dvLeadRateLimit?: Map<string, RateState>;
};

type LeadPayload = {
  source?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  web?: unknown;
  note?: unknown;
  interest?: unknown;
  industry?: unknown;
  features?: unknown;
  timeline?: unknown;
  consent?: unknown;
};

const globalRateStore = globalThis as GlobalRateStore;
const rateLimitStore =
  globalRateStore.__dvLeadRateLimit ?? (globalRateStore.__dvLeadRateLimit = new Map());

function requestOrigin(req: VercelRequest): string | null {
  const raw = req.headers.origin;
  return Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
}

function configuredOrigins(): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  for (const value of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = value.trim();
    if (trimmed) origins.add(trimmed.replace(/\/$/, ""));
  }
  return origins;
}

function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const normalized = new URL(origin).origin;
    if (/^http:\/\/localhost(?::\d+)?$/.test(normalized)) return normalized;
    if (/^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(normalized)) return normalized;
    return configuredOrigins().has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function requestIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function consumeRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= RATE_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/\s{4,}/g, "   ")
        .trim()
        .slice(0, max)
    : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
}

function textLines(payload: Record<string, string>): string {
  return [
    `Zdroj: ${payload.source || "web"}`,
    `Meno: ${payload.name}`,
    `E-mail: ${payload.email}`,
    `Telefón: ${payload.phone || "neuvedený"}`,
    `Firma: ${payload.company || "neuvedená"}`,
    `Web: ${payload.web || "neuvedený"}`,
    "",
    `Riešenie: ${payload.interest || "neuvedené"}`,
    `Odvetvie: ${payload.industry || "neuvedené"}`,
    `Funkcie: ${payload.features || "neuvedené"}`,
    `Termín: ${payload.timeline || "neuvedený"}`,
    "",
    "Poznámka:",
    payload.note || "bez poznámky",
  ].join("\n");
}

async function deliverWithResend(subject: string, text: string, replyTo?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.LEAD_FROM_EMAIL || "Môj Chatbot <onboarding@resend.dev>",
      to: [RECIPIENT],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text,
    }),
  });
  if (!response.ok) throw new Error(`resend-${response.status}`);
  return true;
}

async function deliverWithWebhook(subject: string, text: string): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, text, recipient: RECIPIENT }),
  });
  if (!response.ok) throw new Error(`webhook-${response.status}`);
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const origin = requestOrigin(req);
  const acceptedOrigin = allowedOrigin(origin);
  if (acceptedOrigin) res.setHeader("Access-Control-Allow-Origin", acceptedOrigin);
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(acceptedOrigin ? 204 : 403).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  if (!acceptedOrigin) {
    res.status(403).json({ error: "origin-not-allowed" });
    return;
  }
  if (!String(req.headers["content-type"] ?? "").toLowerCase().includes("application/json")) {
    res.status(415).json({ error: "content-type-must-be-json" });
    return;
  }
  if (Number(req.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
    res.status(413).json({ error: "request-too-large" });
    return;
  }

  const rate = consumeRateLimit(requestIp(req));
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfter));
    res.status(429).json({ error: "rate-limit-exceeded" });
    return;
  }

  const raw = (req.body ?? {}) as LeadPayload;
  const payload = {
    source: clean(raw.source, 80),
    name: clean(raw.name, 80),
    email: clean(raw.email, 160),
    phone: clean(raw.phone, 60),
    company: clean(raw.company, 160),
    web: clean(raw.web, 240),
    note: clean(raw.note, 2_000),
    interest: clean(raw.interest, 200),
    industry: clean(raw.industry, 200),
    features: clean(raw.features, 1_200),
    timeline: clean(raw.timeline, 160),
  };

  const hasContact = Boolean(payload.phone) || validEmail(payload.email);
  if (!payload.name || !hasContact || (payload.email && !validEmail(payload.email)) || raw.consent !== true) {
    res.status(400).json({ error: "invalid-lead" });
    return;
  }

  const subject = `Nový dopyt — ${payload.company || payload.name}`;
  const text = textLines(payload);

  try {
    const delivered =
      (await deliverWithResend(subject, text, validEmail(payload.email) ? payload.email : undefined)) ||
      (await deliverWithWebhook(subject, text));

    if (!delivered) {
      res.status(503).json({
        error: "delivery-not-configured",
        fallback: `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("lead-delivery-failed", error);
    res.status(502).json({
      error: "delivery-failed",
      fallback: `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    });
  }
}
