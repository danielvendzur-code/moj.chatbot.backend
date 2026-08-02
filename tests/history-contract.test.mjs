import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("history accepts the existing Vercel KV variables without colliding with MôjPlot", async () => {
  const log = await read("api/chatLog.ts");

  assert.match(log, /process\.env\.KV_REST_API_URL/);
  assert.match(log, /process\.env\.KV_REST_API_TOKEN/);
  assert.match(log, /CONVERSATION_PREFIX = "chat:conv:"/);
  assert.match(log, /INDEX_KEY = "chat:index"/);
  assert.doesNotMatch(log, /CONVERSATION_PREFIX = "convo:/);
  assert.match(log, /RETENTION_SECONDS = 90 \* 24 \* 60 \* 60/);
});

test("history has a normal password page and never places the password in the URL", async () => {
  const handler = await read("api/transcripts.ts");
  const ui = await read("api/historyUi.ts");
  const vercel = JSON.parse(await read("vercel.json"));

  assert.match(handler, /process\.env\.CHAT_LOG_TOKEN \|\| process\.env\.ADMIN_KEY/);
  assert.match(handler, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(handler, /mojchatbot-history:/);
  assert.doesNotMatch(handler, /req\.query\?\.token/);
  assert.match(ui, /const path = "\/historia"/);
  assert.match(ui, /action="\$\{path\}"/);
  assert.match(ui, /name="password" type="password"/);
  assert.match(ui, /escapeHtml\(turn\.text\)/);
  assert.deepEqual(vercel.rewrites, [
    { source: "/historia", destination: "/api/transcripts" },
  ]);
});

test("history stays private and non-indexable", async () => {
  const handler = await read("api/transcripts.ts");

  assert.match(handler, /Cache-Control", "no-store, max-age=0/);
  assert.match(handler, /X-Robots-Tag", "noindex, nofollow/);
  assert.match(handler, /X-Frame-Options", "DENY/);
  assert.match(handler, /frame-ancestors 'none'/);
  assert.match(handler, /timingSafeEqual/);
  assert.match(handler, /const MIN_TOKEN_LENGTH = 24/);
});
