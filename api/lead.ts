import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  confirmationHtml,
  confirmationText,
  internalHtml,
  internalText,
  type EmailLead,
} from "./emailTemplates.js";

const MAX_BODY_BYTES = 28_000;
const RATE_WINDOW_MS = 15 * 60 * 1_000;
const RATE_MAX_REQUESTS = 8;
const RECIPIENT = process.env.LEAD_TO_EMAIL || "info@mojchatbot.sk";
const SECOND_CONTACT =
  process.env.LEAD_CC_EMAIL === undefined
    ? "daniel@vendzur.sk"
    : process.env.LEAD_CC_EMAIL.trim();
const LEAD_RECIPIENTS = [RECIPIENT, SECOND_CONTACT].filter(
  (address, index, all) => address && all.indexOf(address) === index,
);

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://danielvendzur-code.github.io",
  "https://moj-chatbot-backend.vercel.app",
  "https://vne-n.vercel.app",
  "https://mojchatbot.sk",
  "https://www.mojchatbot.sk",
]);

const SHARED_SENDER = "Môj Chatbot <onboarding@resend.dev>";
/* The production sending domain is verified at resend.com/domains. */
const SENDER = process.env.LEAD_FROM_EMAIL || "Môj Chatbot <info@mojchatbot.sk>";
/* Plain-text brand contact: `Môj Chatbot — ${RECIPIENT}, +421 948 699 433` */

type RateState = { count: number; resetAt: number };
type GlobalRateStore = typeof globalThis & { __dvLeadRateLimit?: Map<string, RateState> };
type Delivery = { ok: boolean; skipped?: boolean; reason?: string };
type LeadPayload = Partial<Record<keyof EmailLead | "consent", unknown>>;

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
    if (/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(normalized)) return normalized;
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

async function resendFailure(response: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await response.json()) as { name?: unknown; message?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const message = typeof body.message === "string" ? body.message : "";
    detail = [name, message].filter(Boolean).join(": ").slice(0, 300);
  } catch {
    /* The status still identifies a refusal without a JSON body. */
  }
  return `resend-${response.status}${detail ? ` ${detail}` : ""}`;
}

async function sendWithResend(payload: Record<string, unknown>): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: SENDER, ...payload }),
  });
}

async function deliverWithResend(
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
): Promise<Delivery> {
  if (!process.env.RESEND_API_KEY) return { ok: false, skipped: true };
  try {
    const response = await sendWithResend({
      to: LEAD_RECIPIENTS,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text,
      html,
    });
    if (response.ok) return { ok: true };
    const reason = await resendFailure(response);
    const hint =
      SENDER === SHARED_SENDER
        ? " — the shared onboarding@resend.dev sender only delivers to the Resend account's own address"
        : response.status === 403
          ? ` — check that the sending domain of "${SENDER}" is verified at resend.com/domains`
          : "";
    return { ok: false, reason: `${reason}${hint}` };
  } catch (error) {
    return { ok: false, reason: `resend-unreachable: ${String(error).slice(0, 200)}` };
  }
}

async function sendConfirmation(payload: EmailLead): Promise<boolean | undefined> {
  if (!process.env.RESEND_API_KEY) return false;
  if (!validEmail(payload.email)) return;
  try {
    const response = await sendWithResend({
      to: [payload.email],
      reply_to: RECIPIENT,
      subject: payload.reference
        ? `Dopyt sme prijali · ${payload.reference}`
        : "Dopyt sme prijali · Môj Chatbot",
      text: confirmationText(payload, RECIPIENT),
      html: confirmationHtml(payload, RECIPIENT),
    });
    if (!response.ok) throw new Error(await resendFailure(response));
    return true;
  } catch (error) {
    console.error("lead-confirmation-failed", String(error));
    return false;
  }
}

async function deliverWithWebhook(subject: string, text: string): Promise<Delivery> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, recipient: RECIPIENT }),
    });
    return response.ok ? { ok: true } : { ok: false, reason: `webhook-${response.status}` };
  } catch (error) {
    return { ok: false, reason: `webhook-unreachable: ${String(error).slice(0, 200)}` };
  }
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
  const payload: EmailLead = {
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
    reference: clean(raw.reference, 40),
  };

  const hasContact = Boolean(payload.phone) || validEmail(payload.email);
  if (!payload.name || !hasContact || (payload.email && !validEmail(payload.email)) || raw.consent !== true) {
    res.status(400).json({ error: "invalid-lead" });
    return;
  }

  const subject = payload.reference
    ? `Nový dopyt · ${payload.reference} · ${payload.company || payload.name}`
    : `Nový dopyt · ${payload.company || payload.name}`;
  const text = internalText(payload);
  const html = internalHtml(payload, RECIPIENT);
  const mailto = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  const attempts: Array<[string, Delivery]> = [
    ["resend", await deliverWithResend(subject, text, html, validEmail(payload.email) ? payload.email : undefined)],
  ];
  if (!attempts.some(([, result]) => result.ok)) {
    attempts.push(["webhook", await deliverWithWebhook(subject, text)]);
  }

  const failures = attempts
    .filter(([, result]) => !result.ok && !result.skipped)
    .map(([channel, result]) => `${channel}: ${result.reason}`);
  if (failures.length) console.error("lead-delivery-failed", failures.join(" | "));

  if (attempts.some(([, result]) => result.ok)) {
    const autoReplySent = (await sendConfirmation(payload)) === true;
    res.status(200).json({ ok: true, autoReplySent });
    return;
  }
  if (!failures.length) {
    res.status(503).json({ error: "delivery-not-configured", fallback: mailto });
    return;
  }
  res.status(502).json({
    error: "delivery-failed",
    reason: failures.join(" | "),
    fallback: mailto,
  });
}
