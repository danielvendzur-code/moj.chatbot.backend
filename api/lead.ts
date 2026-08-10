import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowedOrigin, requestOrigin } from "./origins.js";
import {
  confirmationHtml,
  confirmationText,
  internalHtml,
  internalText,
  type EmailLead,
} from "./emailTemplates.js";

/* Text-only enquiries stay tiny; a lead carrying photos is bounded by what a
   serverless request body will take at all. The browser downscales before it
   uploads, so this is a ceiling rather than a target. */
const MAX_BODY_BYTES = 4_300_000;
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 2_500_000;
const MAX_ATTACHMENTS_TOTAL_BYTES = 3_600_000;
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

const SHARED_SENDER = "Môj Chatbot <onboarding@resend.dev>";
/* The production sending domain is verified at resend.com/domains. */
const SENDER = process.env.LEAD_FROM_EMAIL || "Môj Chatbot <info@mojchatbot.sk>";
/* Plain-text brand contact: `Môj Chatbot — ${RECIPIENT}, +421 948 699 433` */

type RateState = { count: number; resetAt: number };
type GlobalRateStore = typeof globalThis & { __dvLeadRateLimit?: Map<string, RateState> };
type Delivery = { ok: boolean; skipped?: boolean; reason?: string; ids?: string[] };
type LeadPayload = Partial<
  Record<keyof EmailLead | "consent" | "attachments", unknown>
>;
/* Resend's own attachment shape: a filename and base64 content. */
type MailAttachment = { filename: string; content: string; content_type?: string };

const globalRateStore = globalThis as GlobalRateStore;
const rateLimitStore =
  globalRateStore.__dvLeadRateLimit ?? (globalRateStore.__dvLeadRateLimit = new Map());

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

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "application/pdf",
]);

const safeFilename = (value: unknown, index: number): string => {
  /* Whatever the visitor's phone called the file, it becomes a plain name: no
     path separators, no control characters, no surprises for a mail client. */
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || `priloha-${index + 1}.jpg`;
};

/* Base64 without padding slack, so a body that claims to be an image cannot
   smuggle anything else past the size accounting. */
const decodedBytes = (base64: string): number =>
  Math.floor((base64.length * 3) / 4) -
  (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);

function parseAttachments(raw: unknown): MailAttachment[] {
  if (!Array.isArray(raw)) return [];

  const accepted: MailAttachment[] = [];
  let total = 0;

  for (const [index, item] of raw.slice(0, MAX_ATTACHMENTS).entries()) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const data = typeof entry.data === "string" ? entry.data.trim() : "";
    const contentType = typeof entry.contentType === "string" ? entry.contentType : "";
    if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) continue;
    if (!ALLOWED_ATTACHMENT_TYPES.has(contentType)) continue;

    const size = decodedBytes(data);
    if (size <= 0 || size > MAX_ATTACHMENT_BYTES) continue;
    if (total + size > MAX_ATTACHMENTS_TOTAL_BYTES) break;

    total += size;
    accepted.push({
      filename: safeFilename(entry.filename, index),
      content: data,
      content_type: contentType,
    });
  }

  return accepted;
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

/* Resend answers an accepted send with the message id. Accepted is not the
   same as delivered — a mailbox can still bounce it or file it as spam — and
   that id is the only way to look the outcome up at resend.com/emails. It was
   being thrown away, which is what left "it never arrived" untraceable. */
async function resendMessageId(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { id?: unknown };
    return typeof body.id === "string" ? body.id : "";
  } catch {
    return "";
  }
}

async function deliverWithResend(
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
  attachments: MailAttachment[] = [],
): Promise<Delivery> {
  if (!process.env.RESEND_API_KEY) return { ok: false, skipped: true };

  /* One message per recipient rather than one message addressed to both.
     On a shared envelope a single refusing mailbox can take the whole message
     down with it, which loses the lead from every inbox at once — including
     the one that would have accepted it. Addressed separately, the second
     contact still gets the lead when the first one bounces. */
  const results = await Promise.all(
    LEAD_RECIPIENTS.map(async (recipient): Promise<Delivery> => {
      try {
        const response = await sendWithResend({
          to: [recipient],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject,
          text,
          html,
          ...(attachments.length ? { attachments } : {}),
        });
        if (response.ok) {
          const id = await resendMessageId(response);
          return { ok: true, ids: [`${recipient}=${id || "accepted"}`] };
        }
        const reason = await resendFailure(response);
        const hint =
          SENDER === SHARED_SENDER
            ? " — the shared onboarding@resend.dev sender only delivers to the Resend account's own address"
            : response.status === 403
              ? ` — check that the sending domain of "${SENDER}" is verified at resend.com/domains`
              : "";
        return { ok: false, reason: `${recipient}: ${reason}${hint}` };
      } catch (error) {
        return {
          ok: false,
          reason: `${recipient}: resend-unreachable: ${String(error).slice(0, 200)}`,
        };
      }
    }),
  );

  const ids = results.flatMap((result) => result.ids ?? []);
  const refusals = results.flatMap((result) => (result.reason ? [result.reason] : []));
  /* Accepted for even one recipient means the lead is out of our hands and
     the visitor should not be asked to send it again by hand. Any refusal
     alongside it still reaches the log. */
  if (refusals.length) console.error("lead-recipient-refused", refusals.join(" | "));
  if (results.some((result) => result.ok)) return { ok: true, ids };
  return { ok: false, reason: refusals.join(" | ") };
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

  const origin = requestOrigin(req.headers);
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

  const attachments = parseAttachments(raw.attachments);
  if (attachments.length) {
    payload.attachments = attachments
      .map((attachment) => attachment.filename)
      .join(", ");
  }

  const hasContact = Boolean(payload.phone) || validEmail(payload.email);
  /* The quick "write to me" form asks for an address and a message and nothing
     else, so a missing name is normal there. The address itself identifies the
     sender well enough to put a subject line together. */
  if (!payload.name && validEmail(payload.email)) {
    payload.name = payload.email.split("@")[0].slice(0, 80);
  }
  if (!payload.name || !hasContact || (payload.email && !validEmail(payload.email)) || raw.consent !== true) {
    res.status(400).json({ error: "invalid-lead" });
    return;
  }

  const label = payload.source === "widget-email" ? "Nová správa" : "Nový dopyt";
  const subject = payload.reference
    ? `${label} · ${payload.reference} · ${payload.company || payload.name}`
    : `${label} · ${payload.company || payload.name}`;
  const text = internalText(payload);
  const html = internalHtml(payload, RECIPIENT);
  const mailto = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  const attempts: Array<[string, Delivery]> = [
    [
      "resend",
      await deliverWithResend(
        subject,
        text,
        html,
        validEmail(payload.email) ? payload.email : undefined,
        attachments,
      ),
    ],
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
    /* Handing the message ids back is what makes a lead that was accepted but
       never landed diagnosable: each one looks up at resend.com/emails as
       Delivered, Bounced or Complained. */
    const ids = attempts.flatMap(([, result]) => result.ids ?? []);
    console.log(
      "lead-accepted",
      `ref=${payload.reference || "—"}`,
      `recipients=${ids.join(",") || "—"}`,
      `attachments=${attachments.length}`,
      `autoReply=${autoReplySent}`,
    );
    res.status(200).json({ ok: true, autoReplySent, ids });
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
