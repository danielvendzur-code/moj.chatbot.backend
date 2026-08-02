/* The conversation survives a reload, a navigation and a closed tab.

   Without this the widget forgets everything the moment the page changes,
   which on a site where people browse between pages means re-introducing
   yourself to the same assistant over and over. */

const STORAGE_KEY = "dv-assistant-chat-v1";
/* Long enough that coming back after lunch continues the thread, short enough
   that a conversation from last week does not resurface as if it were live. */
const MAX_AGE_MS = 24 * 60 * 60 * 1_000;
/* A cap on both what is stored and what is restored, so a long session cannot
   grow the payload without bound. */
const MAX_TURNS = 40;

export type StoredMessage = { id: number; from: "bot" | "me"; text: string };
type Stored = { savedAt: number; nextId: number; messages: StoredMessage[] };

/* Private browsing and blocked storage both throw on access rather than
   returning null, so every entry point is guarded. History is a convenience;
   losing it may never break the widget. */
function storage(): Storage | null {
  try {
    const probe = window.localStorage;
    const key = `${STORAGE_KEY}-probe`;
    probe.setItem(key, "1");
    probe.removeItem(key);
    return probe;
  } catch {
    return null;
  }
}

export function loadHistory(): { messages: StoredMessage[]; nextId: number } | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > MAX_AGE_MS ||
      !Array.isArray(parsed.messages)
    ) {
      store.removeItem(STORAGE_KEY);
      return null;
    }

    const messages = parsed.messages
      .filter(
        (message): message is StoredMessage =>
          !!message &&
          typeof message.id === "number" &&
          (message.from === "bot" || message.from === "me") &&
          typeof message.text === "string" &&
          message.text.length > 0,
      )
      .slice(-MAX_TURNS);
    if (!messages.some((message) => message.from === "me")) return null;

    /* Ids have to continue past anything restored, or a new message would
       collide with a stored one and React would reuse the wrong node. */
    const highest = messages.reduce((max, message) => Math.max(max, message.id), 0);
    const nextId =
      typeof parsed.nextId === "number" && parsed.nextId > highest
        ? parsed.nextId
        : highest + 1;
    return { messages, nextId };
  } catch {
    return null;
  }
}

export function saveHistory(messages: StoredMessage[], nextId: number): void {
  const store = storage();
  if (!store) return;
  try {
    /* Only a conversation the visitor actually started is worth keeping — the
       opening greeting alone would restore as a thread that never happened. */
    if (!messages.some((message) => message.from === "me")) {
      store.removeItem(STORAGE_KEY);
      return;
    }
    const payload: Stored = {
      savedAt: Date.now(),
      nextId,
      messages: messages
        .slice(-MAX_TURNS)
        .map(({ id, from, text }) => ({ id, from, text })),
    };
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* A full or blocked store just means no history; the thread still works. */
  }
}

const CONVERSATION_KEY = "dv-assistant-conversation-v1";

/* A stable id so the server can group a visitor's turns into one readable
   transcript. It identifies the conversation, not the person: it is random,
   carries nothing about them, and a reset mints a new one. */
export function conversationId(): string {
  const store = storage();
  if (!store) return "";
  try {
    const existing = store.getItem(CONVERSATION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    store.setItem(CONVERSATION_KEY, fresh);
    return fresh;
  } catch {
    return "";
  }
}

export function clearHistory(): void {
  try {
    const store = storage();
    store?.removeItem(STORAGE_KEY);
    /* Starting over starts a new transcript too, rather than appending a
       fresh conversation onto the one the visitor just abandoned. */
    store?.removeItem(CONVERSATION_KEY);
  } catch {
    /* Nothing to clear is the same outcome as a cleared store. */
  }
}
