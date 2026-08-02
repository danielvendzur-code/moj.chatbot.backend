/* Server-side transcripts, so the owner can read what visitors actually asked.

   Backed by Upstash Redis over its REST API, which is the one Redis shape that
   works from a serverless function: no connection pool to keep warm, just a
   fetch. Turned on by setting UPSTASH_REDIS_REST_URL and
   UPSTASH_REDIS_REST_TOKEN; with either missing, logging is skipped and the
   chat behaves exactly as before.

   Two keys per conversation:
     chat:conv:<id>  a list of turns, oldest first
     chat:index      a sorted set of conversation ids scored by last activity,
                     so the viewer can show the most recent first without
                     scanning every key.

   Everything here is best effort. A transcript is a convenience for the owner;
   it may never cost a visitor their answer, so every failure is swallowed. */

const CONVERSATION_PREFIX = "chat:conv:";
const INDEX_KEY = "chat:index";
/* Transcripts expire on their own. Keeping visitor conversations indefinitely
   is a liability rather than an asset, and 90 days is long enough to review a
   quarter's questions. */
const RETENTION_SECONDS = 90 * 24 * 60 * 60;
/* A single conversation cannot grow without bound. */
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

export function chatLogEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/* Upstash's REST pipeline takes an array of command arrays and answers with an
   array of results in the same order. */
async function pipeline(commands: unknown[][]): Promise<unknown[] | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
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

/* Ids come from the browser, so they are treated as untrusted: anything that
   is not a plain short token is rejected rather than used to build a key. */
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

/* Called after a reply has been produced. Awaiting it would add a round trip
   to every answer, so callers fire it and move on — see api/chat.ts. */
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
    /* Keep only the newest turns if a conversation runs very long. */
    ["LTRIM", key, -MAX_TURNS_PER_CONVERSATION, -1],
    ["EXPIRE", key, RETENTION_SECONDS],
    ["ZADD", INDEX_KEY, now, id],
    /* Drop the oldest ids so the index cannot grow forever either. */
    ["ZREMRANGEBYRANK", INDEX_KEY, 0, -(MAX_INDEXED_CONVERSATIONS + 1)],
    ["EXPIRE", INDEX_KEY, RETENTION_SECONDS],
  ]);
}

export async function listConversations(limit = 50): Promise<ConversationSummary[]> {
  const capped = Math.min(Math.max(limit, 1), 200);
  /* Newest first. */
  const indexed = await pipeline([["ZRANGE", INDEX_KEY, 0, capped - 1, "REV", "WITHSCORES"]]);
  const flat = Array.isArray(indexed?.[0]) ? (indexed[0] as unknown[]) : [];
  const ids: Array<{ id: string; lastAt: number }> = [];
  for (let i = 0; i < flat.length; i += 2) {
    const id = safeConversationId(flat[i]);
    if (id) ids.push({ id, lastAt: Number(flat[i + 1]) || 0 });
  }
  if (!ids.length) return [];

  /* One round trip for every conversation's length and opening turn. */
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
      return [{ at: Number(turn.at) || 0, role: turn.role, text: String(turn.text ?? "") }];
    } catch {
      return [];
    }
  });
}
