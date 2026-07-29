const DEFAULT_ENDPOINT = "https://moj-chatbot-backend.vercel.app/api/chat";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_HISTORY = 10;
const MAX_MESSAGE_CHARS = 1_000;
const MAX_REPLY_CHARS = 4_000;

declare global {
  interface Window {
    __DV_ASSISTANT_ENDPOINT__?: string;
  }
}

export type ChatRole = "user" | "assistant";
export type ChatTurn = { role: ChatRole; text: string };

function safeEndpoint(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
      return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function chatEndpoint(): string {
  if (typeof window !== "undefined") {
    const override = safeEndpoint(window.__DV_ASSISTANT_ENDPOINT__);
    if (override) return override;
  }
  return DEFAULT_ENDPOINT;
}

export function isChatConfigured(): boolean {
  return Boolean(safeEndpoint(chatEndpoint()));
}

function cleanText(value: string, limit: number): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, limit);
}

/* The offline answers a visitor actually reads when the chat endpoint is not
   reachable. Same rule as the rest of the widget: no jargon, short sentences,
   and say plainly what happens next. */
export function localAssistantReply(question: string): string {
  const normalized = question.toLocaleLowerCase("sk");

  if (/cen|koľko|rozpočet|stojí|suma/.test(normalized)) {
    return "Záleží na tom, čo všetko má chatbot zvládnuť. Kliknite na „Spočítať cenu“, odpoviete mi na štyri otázky a hneď uvidíte odhad. Nič tým neplatíte.";
  }
  if (/kalkula|výpočet|odhad/.test(normalized)) {
    return "Zákazník zadá napríklad rozmery alebo množstvo a chatbot mu hneď povie cenu — podľa pravidiel, ktoré si určíte vy. Vám potom pošle jeho kontakt aj s tým, čo si vybral.";
  }
  if (/konfigur|produkt|variant|dopln/.test(normalized)) {
    return "Chatbot sa zákazníka postupne spýta na rozmery, materiál, farbu aj doplnky. Vy dostanete hotový dopyt, ktorý už len naceníte.";
  }
  if (/rezerv|termín|kalendár/.test(normalized)) {
    return "Áno. Chatbot zistí, čo zákazník potrebuje, ponúkne voľný termín, zapíše ho do kalendára a potvrdenie pošle jemu aj vám.";
  }
  if (/ako dlho|termín realiz|spustenie|hotov/.test(normalized)) {
    return "Jednoduchý chatbot zvládnem za niekoľko dní. Ak má aj počítať ceny alebo rezervovať termíny, potrebujem trochu viac času. Presne vám to poviem, keď mi napíšete, čo potrebujete.";
  }
  if (/web|vložiť|integr|wordpress|shopify/.test(normalized)) {
    return "Váš web prerábať netreba. Chatbot doň pridám tak, aby ladil s vašimi farbami, fungoval na mobile a dopyty vám posielal na e-mail, do kalendára alebo do tabuľky.";
  }
  if (/kontakt|zavola|email|e-mail/.test(normalized)) {
    return "Napíšte na daniel@vendzur.sk alebo zavolajte na +421 948 699 433. Najrýchlejšie je kliknúť na „Spočítať cenu“ — ozvem sa vám do jedného dňa.";
  }

  return "Poradím vám, čo by váš web mohol robiť za vás: odpovedať zákazníkom, počítať ceny alebo dohadovať termíny. Napíšte mi, čo vás dnes najviac zdržuje, alebo kliknite na „Spočítať cenu“.";
}

export async function sendChat(history: ChatTurn[]): Promise<string> {
  const lastQuestion =
    [...history].reverse().find((turn) => turn.role === "user")?.text ?? "";
  const endpoint = safeEndpoint(chatEndpoint());
  if (!endpoint) return localAssistantReply(lastQuestion);

  const messages = history.slice(-MAX_HISTORY).map((turn) => ({
    role: turn.role,
    content: cleanText(turn.text, MAX_MESSAGE_CHARS),
  }));

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ messages }),
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "strict-origin-when-cross-origin",
      signal: controller.signal,
    });

    if (!response.ok) return localAssistantReply(lastQuestion);

    const data = (await response.json()) as { reply?: unknown };
    const reply =
      typeof data.reply === "string"
        ? cleanText(data.reply, MAX_REPLY_CHARS)
        : "";
    return reply || localAssistantReply(lastQuestion);
  } catch {
    return localAssistantReply(lastQuestion);
  } finally {
    window.clearTimeout(timeout);
  }
}
