import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  chatLogEnabled,
  listConversations,
  readConversation,
  safeConversationId,
  type LoggedTurn,
} from "./chatLog.js";

/* The owner's window onto what visitors actually asked.

   This endpoint serves other people's conversations, so it is deliberately
   the least permissive thing in the codebase: one shared secret, compared in
   constant time, no CORS, no indexing, no caching. Without CHAT_LOG_TOKEN set
   it does not answer at all. */

function unauthorized(res: VercelResponse): void {
  res.status(401).json({ error: "unauthorized" });
}

/* Hashing both sides first makes the comparison constant-time regardless of
   length, which a raw timingSafeEqual on differing lengths cannot be. */
function tokenMatches(supplied: string, expected: string): boolean {
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/* A short token is guessable, and what is behind this endpoint is other
   people's conversations. Rather than serve it weakly protected, it refuses. */
const MIN_TOKEN_LENGTH = 24;
const SESSION_COOKIE = "dv_transcripts";
const SESSION_MAX_AGE = 8 * 60 * 60;

function suppliedToken(req: VercelRequest): string {
  const header = req.headers.authorization;
  const bearer = Array.isArray(header) ? header[0] : header;
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  const query = req.query?.token;
  const fromQuery = (Array.isArray(query) ? query[0] : query)?.trim();
  if (fromQuery) return fromQuery;
  /* The cookie is what keeps the token out of every link on the page once the
     first request has proved it. */
  const cookies = String(req.headers.cookie ?? "");
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const when = (at: number): string =>
  at ? new Date(at).toLocaleString("sk-SK", { timeZone: "Europe/Bratislava" }) : "—";

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="sk"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:24px 16px 64px; background:#100e0c; color:#fff8f2;
         font:15px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 780px; margin: 0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:#b9aaa0; font-size:13px; margin:0 0 24px; }
  a { color:#ffc79d; }
  ul { list-style:none; margin:0; padding:0; }
  li { border:1px solid rgba(255,199,157,.16); border-radius:14px; padding:12px 14px;
       margin-bottom:10px; background:#18130f; }
  li a { text-decoration:none; display:block; }
  .meta { color:#8f8178; font-size:12px; margin-bottom:4px; }
  .preview { color:#fff8f2; overflow-wrap:anywhere; }
  .turn { border-radius:14px; padding:10px 14px; margin-bottom:8px; overflow-wrap:anywhere;
          white-space:pre-wrap; }
  .user { background:#ffc79d; color:#0a0908; margin-left:15%; }
  .bot  { background:#18130f; border:1px solid rgba(255,199,157,.16); margin-right:15%; }
  .empty { color:#b9aaa0; }
</style>
</head><body><main>${body}</main></body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  /* Transcripts are never cached, never indexed and never shared cross-origin. */
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const expected = process.env.CHAT_LOG_TOKEN;
  if (!expected) {
    res.status(503).json({ error: "transcripts-not-configured" });
    return;
  }
  if (expected.length < MIN_TOKEN_LENGTH) {
    console.error(
      "transcripts-token-too-short",
      `CHAT_LOG_TOKEN must be at least ${MIN_TOKEN_LENGTH} characters`,
    );
    res.status(503).json({ error: "transcripts-token-too-weak" });
    return;
  }
  const supplied = suppliedToken(req);
  if (!supplied || !tokenMatches(supplied, expected)) {
    unauthorized(res);
    return;
  }

  /* Proved once, remembered for the session, so the token stops travelling in
     every link and stops appearing in the page source. */
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(supplied)}; Path=/api/transcripts; Max-Age=${SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
  );
  if (!chatLogEnabled()) {
    res.status(503).json({ error: "chat-log-not-configured" });
    return;
  }

  const wantsJson = String(req.headers.accept ?? "").includes("application/json");
  const id = safeConversationId(
    Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id,
  );

  if (id) {
    const turns = await readConversation(id);
    if (wantsJson) {
      res.status(200).json({ id, turns });
      return;
    }
    const body = turns.length
      ? turns
          .map(
            (turn: LoggedTurn) =>
              `<div class="turn ${turn.role === "user" ? "user" : "bot"}">${escapeHtml(turn.text)}</div>`,
          )
          .join("")
      : '<p class="empty">Táto konverzácia už vypršala alebo neexistuje.</p>';
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(
      page(
        `Konverzácia ${id}`,
        `<h1>Konverzácia</h1><p class="sub">${escapeHtml(id)} · <a href="/api/transcripts">späť na zoznam</a></p>${body}`,
      ),
    );
    return;
  }

  const limitRaw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit;
  const conversations = await listConversations(Number(limitRaw) || 50);

  if (wantsJson) {
    res.status(200).json({ conversations });
    return;
  }

  const list = conversations.length
    ? `<ul>${conversations
        .map(
          (c) =>
            `<li><a href="/api/transcripts?id=${encodeURIComponent(c.id)}">
              <div class="meta">${escapeHtml(when(c.lastAt))} · ${c.turns} správ</div>
              <div class="preview">${escapeHtml(c.preview || "—")}</div>
            </a></li>`,
        )
        .join("")}</ul>`
    : '<p class="empty">Zatiaľ žiadne konverzácie.</p>';

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(
    page(
      "História chatov",
      `<h1>História chatov</h1><p class="sub">${conversations.length} konverzácií · uchovávané 90 dní</p>${list}`,
    ),
  );
}
