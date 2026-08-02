/* Server-side transcripts, so the owner can read what visitors actually asked.

   Backed by Upstash Redis over its REST API. The backend accepts both the
   current Upstash names and the older Vercel KV names used by MôjPlot:

   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   - KV_REST_API_URL / KV_REST_API_TOKEN

   Two keys per conversation:
     chat:conv:<id>  a list of turns, oldest first
     chat:index      a sorted set of conversation ids scored by last activity

   MôjPlot uses a different namespace (`convo:*`), so both projects can share
   one Redis database without overwriting each other's conversations.

   Everything here is best effort. A transcript must never slow down or break
   a visitor's answer, so storage failures are swallowed after being logged. */

const CONVERSATION_PREFIX = "chat:conv:";
const INDEX_KEY = "chat:index";
const RETENTION_SECONDS = 90 * 24 * 60 * 60;
const MAX_TURNS_PER_CONVERSATION = 200;
const MAX_INDEXED_CONVERSATIONS = 2_000;
const MAX_TEXT = 2_000;

export type LoggedTurn = {
  at: number;
  role: "user" | "assistant";
  text: string;
};

export type ConversationSummary = {
  id: string;
  lastAt: number;
  turns: number;
  preview: string;
};

function redisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function redisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

export function chatLogEnabled(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
  );
}

async function pipeline(commands: unknown[][]): Promise<unknown[] | null> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) return null;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error("chat-log-upstash", `HTTP ${response.status}`);
      return null;
    }

    const body = (await response.json()) as Array<{ result?: unknown; error?: unknown }>;
    if (!Array.isArray(body)) return null;

    for (const entry of body) {
      if (entry?.error) console.error("chat-log-upstash", String(entry.error).slice(0, 200));
    }

    return body.map((entry) => entry?.result ?? null);
  } catch (error) {
    console.error("chat-log-upstash", String(error).slice(0, 200));
    return null;
  }
}

export function safeConversationId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(trimmed) ? trimmed : null;
}

function clip(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

export async function logExchange(
  conversationId: string,
  question: string,
  answer: string,
): Promise<void> {
  if (!chatLogEnabled()) return;

  const id = safeConversationId(conversationId);
  if (!id) return;

  const now = Date.now();
  const key = `${CONVERSATION_PREFIX}${id}`;
  const turns: LoggedTurn[] = [
    { at: now, role: "user", text: clip(question) },
    { at: now, role: "assistant", text: clip(answer) },
  ];

  if (turns.every((turn) => !turn.text)) return;

  await pipeline([
    ["RPUSH", key, ...turns.map((turn) => JSON.stringify(turn))],
    ["LTRIM", key, -MAX_TURNS_PER_CONVERSATION, -1],
    ["EXPIRE", key, RETENTION_SECONDS],
    ["ZADD", INDEX_KEY, now, id],
    ["ZREMRANGEBYRANK", INDEX_KEY, 0, -(MAX_INDEXED_CONVERSATIONS + 1)],
    ["EXPIRE", INDEX_KEY, RETENTION_SECONDS],
  ]);
}

export async function listConversations(limit = 50): Promise<ConversationSummary[]> {
  const capped = Math.min(Math.max(limit, 1), 200);
  const indexed = await pipeline([
    ["ZRANGE", INDEX_KEY, 0, capped - 1, "REV", "WITHSCORES"],
  ]);
  const flat = Array.isArray(indexed?.[0]) ? (indexed[0] as unknown[]) : [];
  const ids: Array<{ id: string; lastAt: number }> = [];

  for (let index = 0; index < flat.length; index += 2) {
    const id = safeConversationId(flat[index]);
    if (id) ids.push({ id, lastAt: Number(flat[index + 1]) || 0 });
  }

  if (!ids.length) return [];

  const details = await pipeline(
    ids.flatMap(({ id }) => [
      ["LLEN", `${CONVERSATION_PREFIX}${id}`],
      ["LINDEX", `${CONVERSATION_PREFIX}${id}`, 0],
    ]),
  );

  return ids.map(({ id, lastAt }, index) => {
    const turns = Number(details?.[index * 2] ?? 0) || 0;
    const first = details?.[index * 2 + 1];
    let preview = "";

    if (typeof first === "string") {
      try {
        preview = String((JSON.parse(first) as LoggedTurn).text ?? "").slice(0, 120);
      } catch {
        preview = "";
      }
    }

    return { id, lastAt, turns, preview };
  });
}

export async function readConversation(id: string): Promise<LoggedTurn[]> {
  const safe = safeConversationId(id);
  if (!safe) return [];

  const result = await pipeline([
    ["LRANGE", `${CONVERSATION_PREFIX}${safe}`, 0, MAX_TURNS_PER_CONVERSATION - 1],
  ]);
  const raw = Array.isArray(result?.[0]) ? (result[0] as unknown[]) : [];

  return raw.flatMap((entry) => {
    if (typeof entry !== "string") return [];

    try {
      const turn = JSON.parse(entry) as LoggedTurn;
      if (turn.role !== "user" && turn.role !== "assistant") return [];
      return [
        {
          at: Number(turn.at) || 0,
          role: turn.role,
          text: String(turn.text ?? ""),
        },
      ];
    } catch {
      return [];
    }
  });
}
