/*
 * Klientske napojenie na AI chat. GitHub Pages je statický, takže API kľúč
 * nesmie ísť do prehliadača — chat prechádza cez serverless proxy (api/chat.ts
 * nasadenú na Vercel). Sem stačí doplniť URL tejto funkcie.
 */

/*
 * URL proxy funkcie. Nahraďte adresou svojho Vercel projektu, napr.
 *   https://moj-chatbot-backend.vercel.app/api/chat
 * Alebo ju nastavte za behu bez rebuildu:
 *   window.__DV_ASSISTANT_ENDPOINT__ = "https://…/api/chat";
 */
const DEFAULT_ENDPOINT = "https://REPLACE-ME.vercel.app/api/chat";

declare global {
  interface Window {
    __DV_ASSISTANT_ENDPOINT__?: string;
  }
}

export type ChatRole = "user" | "assistant";
export type ChatTurn = { role: ChatRole; text: string };

export function chatEndpoint(): string {
  if (typeof window !== "undefined" && window.__DV_ASSISTANT_ENDPOINT__) {
    return window.__DV_ASSISTANT_ENDPOINT__;
  }
  return DEFAULT_ENDPOINT;
}

export function isChatConfigured(): boolean {
  return !chatEndpoint().includes("REPLACE-ME");
}

/*
 * Pošle posledných pár správ na proxy a vráti text odpovede asistenta.
 * Vyhodí chybu pri zlyhaní alebo ak endpoint ešte nie je nastavený —
 * volajúci ju zachytí a zobrazí elegantný fallback.
 */
export async function sendChat(history: ChatTurn[]): Promise<string> {
  if (!isChatConfigured()) {
    throw new Error("chat-endpoint-not-configured");
  }

  const messages = history.slice(-10).map((turn) => ({
    role: turn.role,
    content: turn.text.slice(0, 1000),
  }));

  const response = await fetch(chatEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`chat-http-${response.status}`);
  }

  const data = (await response.json()) as { reply?: unknown };
  const reply = typeof data.reply === "string" ? data.reply.trim() : "";
  if (!reply) {
    throw new Error("chat-empty-reply");
  }
  return reply;
}
