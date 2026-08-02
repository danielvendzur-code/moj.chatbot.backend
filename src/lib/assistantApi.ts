const DEFAULT_ENDPOINT = "https://moj-chatbot-backend.vercel.app/api/chat";
const BUILT_ENDPOINT =
  import.meta.env.VITE_CHAT_API_URL?.trim() || DEFAULT_ENDPOINT;
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
  return BUILT_ENDPOINT;
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
    return "Cena závisí od toho, čo má riešenie robiť a s čím sa má prepojiť. Vo „Vyskladať riešenie“ mi označte potrebné funkcie a Daniel sa vám ozve s konkrétnym návrhom.";
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
    return "Napíšte na info@mojchatbot.sk alebo zavolajte na +421 948 699 433. Najrýchlejšie je vyskladať riešenie priamo tu — ozvem sa vám do jedného dňa.";
  }

  return "Poradím vám, čo by váš web mohol robiť za vás: odpovedať zákazníkom, počítať ceny alebo dohadovať termíny. Napíšte mi, čo vás dnes najviac zdržuje, alebo si vyskladajte riešenie.";
}

/* Called with the reply so far, every time more of it arrives. The caller uses
   it to paint words as they land instead of after the last one. */
export type ChatStreamHandler = (partial: string) => void;

/* Parses `event:`/`data:` frames out of an SSE body. Frames are separated by a
   blank line, and a chunk boundary can land anywhere, so whatever follows the
   last separator stays in the buffer until the next read completes it. */
function parseEventStream(
  buffer: string,
  onFrame: (event: string, data: string) => void,
): string {
  let rest = buffer;
  let separator = rest.indexOf("\n\n");
  while (separator !== -1) {
    const frame = rest.slice(0, separator);
    rest = rest.slice(separator + 2);
    let event = "message";
    let data = "";
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (data) onFrame(event, data);
    separator = rest.indexOf("\n\n");
  }
  return rest;
}

export async function sendChat(
  history: ChatTurn[],
  requestSignal?: AbortSignal,
  onPartial?: ChatStreamHandler,
  conversationId?: string,
): Promise<string> {
  const lastQuestion =
    [...history].reverse().find((turn) => turn.role === "user")?.text ?? "";
  const endpoint = safeEndpoint(chatEndpoint());
  if (!endpoint) return localAssistantReply(lastQuestion);

  const messages = history.slice(-MAX_HISTORY).map((turn) => ({
    role: turn.role,
    content: cleanText(turn.text, MAX_MESSAGE_CHARS),
  }));

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (requestSignal?.aborted) controller.abort();
  else
    requestSignal?.addEventListener("abort", abortFromCaller, { once: true });
  /* The timeout guards the wait for the first byte. Once text is arriving the
     stream is alive, so cutting it off mid-sentence would be the bug, not the
     fix — the timer is cleared as soon as the first delta lands. */
  let timeout: number | null = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  const clearTimeoutOnce = () => {
    if (timeout === null) return;
    window.clearTimeout(timeout);
    timeout = null;
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: onPartial ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify({ messages, conversationId }),
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "strict-origin-when-cross-origin",
      signal: controller.signal,
    });

    if (!response.ok) return localAssistantReply(lastQuestion);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/event-stream") || !response.body) {
      const data = (await response.json()) as { reply?: unknown };
      const reply =
        typeof data.reply === "string"
          ? cleanText(data.reply, MAX_REPLY_CHARS)
          : "";
      return reply || localAssistantReply(lastQuestion);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reply = "";

    const handleFrame = (event: string, data: string) => {
      /* An `error` frame after some text still leaves the visitor with the
         words already on screen, so a truncated reply beats replacing what
         they just watched arrive. Only an empty reply falls back. */
      if (event !== "delta") return;
      try {
        const parsed = JSON.parse(data) as { text?: unknown };
        if (typeof parsed.text !== "string" || !parsed.text) return;
        clearTimeoutOnce();
        reply = (reply + parsed.text).slice(0, MAX_REPLY_CHARS);
        onPartial?.(reply);
      } catch {
        /* A frame we cannot read is a frame we skip; the rest still arrives. */
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = parseEventStream(
        buffer + decoder.decode(value, { stream: true }),
        handleFrame,
      );
    }
    parseEventStream(buffer + "\n\n", handleFrame);

    const finished = cleanText(reply, MAX_REPLY_CHARS);
    return finished || localAssistantReply(lastQuestion);
  } catch {
    return localAssistantReply(lastQuestion);
  } finally {
    clearTimeoutOnce();
    requestSignal?.removeEventListener("abort", abortFromCaller);
  }
}
