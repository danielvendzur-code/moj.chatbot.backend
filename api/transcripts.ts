import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  chatLogEnabled,
  listConversations,
  readConversation,
  safeConversationId,
} from "./chatLog.js";
import {
  renderConfiguration,
  renderConversation,
  renderDashboard,
  renderLogin,
} from "./historyUi.js";

const MIN_PASSWORD_LENGTH = 12;
const SESSION_COOKIE = "mc_history_session";
const SESSION_MAX_AGE = 8 * 60 * 60;
const HISTORY_PATH = "/historia";

function hash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string): boolean {
  return timingSafeEqual(hash(left), hash(right));
}

function expectedPassword(): string {
  return process.env.CHAT_LOG_TOKEN || process.env.ADMIN_KEY || "";
}

function sessionValue(password: string): string {
  return createHash("sha256").update(`mojchatbot-history:${password}`).digest("hex");
}

function cookieValue(req: VercelRequest): string {
  const cookies = String(req.headers.cookie ?? "");
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function bearerValue(req: VercelRequest): string {
  const value = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function isAuthorized(req: VercelRequest, password: string): boolean {
  const bearer = bearerValue(req);
  if (bearer && safeEqual(bearer, password)) return true;

  const session = cookieValue(req);
  return Boolean(session && safeEqual(session, sessionValue(password)));
}

function parseBody(req: VercelRequest): Record<string, unknown> {
  if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body !== "string") return {};

  const contentType = String(req.headers["content-type"] ?? "");
  if (contentType.includes("application/json")) {
    try {
      const value = JSON.parse(req.body) as unknown;
      return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return Object.fromEntries(new URLSearchParams(req.body));
}

function setSession(res: VercelResponse, password: string): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionValue(password)}; Path=${HISTORY_PATH}; Max-Age=${SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
  );
}

function clearSession(res: VercelResponse): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=${HISTORY_PATH}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
  );
}

function redirect(res: VercelResponse): void {
  res.statusCode = 303;
  res.setHeader("Location", HISTORY_PATH);
  res.end();
}

function secure(res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
}

function html(res: VercelResponse, status: number, content: string): void {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(status).send(content);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  secure(res);

  const password = expectedPassword();
  if (!password) {
    html(res, 503, renderConfiguration("Chýba ADMIN_KEY."));
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    html(
      res,
      503,
      renderConfiguration(`ADMIN_KEY musí mať aspoň ${MIN_PASSWORD_LENGTH} znakov.`),
    );
    return;
  }
  if (!chatLogEnabled()) {
    html(
      res,
      503,
      renderConfiguration("Chýbajú KV_REST_API_URL alebo KV_REST_API_TOKEN."),
    );
    return;
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const action = String(body.action ?? "");

    if (action === "logout") {
      clearSession(res);
      redirect(res);
      return;
    }

    if (action !== "login") {
      res.status(400).json({ error: "invalid-action" });
      return;
    }

    const supplied = String(body.password ?? body.token ?? "");
    if (!supplied || !safeEqual(supplied, password)) {
      html(res, 401, renderLogin(true));
      return;
    }

    setSession(res, password);
    redirect(res);
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const wantsJson = String(req.headers.accept ?? "").includes("application/json");
  if (!isAuthorized(req, password)) {
    if (wantsJson) {
      res.status(401).json({ error: "unauthorized" });
    } else {
      html(res, 200, renderLogin(false));
    }
    return;
  }

  if (bearerValue(req)) setSession(res, password);

  const id = safeConversationId(
    Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id,
  );

  if (id) {
    const turns = await readConversation(id);
    if (wantsJson) {
      res.status(200).json({ id, turns });
    } else {
      html(res, 200, renderConversation(id, turns));
    }
    return;
  }

  const limitRaw = Array.isArray(req.query?.limit) ? req.query.limit[0] : req.query?.limit;
  const conversations = await listConversations(Number(limitRaw) || 200);

  if (wantsJson) {
    res.status(200).json({ conversations });
  } else {
    html(res, 200, renderDashboard(conversations));
  }
}
