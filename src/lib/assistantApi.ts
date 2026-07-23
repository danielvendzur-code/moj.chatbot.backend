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

export function localAssistantReply(question: string): string {
  const normalized = question.toLocaleLowerCase("sk");

  if (/cen|koľko|rozpočet|stojí|suma/.test(normalized)) {
    return "Cena závisí od rozsahu, logiky a prepojení. Cez „Vyskladať riešenie“ mi za minútu zadáte typ chatbota a Daniel vám pripraví konkrétny odhad bez záväzkov.";
  }
  if (/kalkula|výpočet|odhad/.test(normalized)) {
    return "Chatbot s kalkulačkou počas rozhovoru zozbiera parametre a vypočíta cenu, spotrebu alebo rozsah podľa vašich vlastných pravidiel. Výsledok aj kontakt odošle firme ako hotový dopyt.";
  }
  if (/konfigur|produkt|variant|dopln/.test(normalized)) {
    return "Konfigurátor prevedie zákazníka výberom typu, rozmerov, materiálu, farby a doplnkov. Na konci vznikne presná špecifikácia, ktorú môžete rovno naceniť alebo spracovať.";
  }
  if (/rezerv|termín|kalendár/.test(normalized)) {
    return "Áno. Chatbot môže zistiť službu, ponúknuť dostupný termín, zapísať rezerváciu do kalendára a odoslať potvrdenie zákazníkovi aj firme.";
  }
  if (/ako dlho|termín realiz|spustenie|hotov/.test(normalized)) {
    return "Jednoduchšie riešenie môže byť pripravené v priebehu niekoľkých dní, komplexnejšie závisí od logiky a prepojení. Presný postup dostanete po krátkom zadaní cez konfigurátor.";
  }
  if (/web|vložiť|integr|wordpress|shopify/.test(normalized)) {
    return "Widget sa dá vložiť na existujúci web bez kompletnej prerábky. Prispôsobí sa farbám značky, funguje na mobile a dopyty môže posielať na e-mail, kalendár, tabuľku alebo CRM.";
  }
  if (/kontakt|zavola|email|e-mail/.test(normalized)) {
    return "Daniela môžete kontaktovať na daniel@vendzur.sk alebo +421 948 699 433. Najrýchlejšie je otvoriť „Vyskladať riešenie“ a poslať krátke zadanie.";
  }

  return "Pomôžem vám vybrať chatbot na mieru, kalkulačku, konfigurátor alebo rezervácie. Otvorte „Vyskladať riešenie“ alebo mi napíšte, čo má zákazník na vašom webe vedieť vybaviť bez telefonátu.";
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
