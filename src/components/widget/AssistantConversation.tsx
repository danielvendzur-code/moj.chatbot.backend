import { BrandMark } from "./BrandMark";
import { useEffect, useRef, useState } from "react";
import { sendChat, type ChatTurn } from "../../lib/assistantApi";
import {
  clearHistory,
  conversationId,
  loadHistory,
  saveHistory,
} from "../../lib/chatHistory";
import { track } from "../../lib/analytics";
import { BubbleLogo } from "./BubbleLogo";
import { MessageSheet } from "./MessageSheet";
import { ScrollCue } from "./ScrollCue";
import { WidgetIcon } from "./WidgetIcon";

type AssistantConversationProps = {
  active: boolean;
  resetToken: number;
  onOpenBuilder: () => void;
};

type ChatMessage = {
  id: number;
  from: "bot" | "me";
  text: string;
  streaming?: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: "bot",
    text: "Dobrý deň. Pomôžem vám vybrať riešenie pre váš web.",
  },
  {
    id: 2,
    from: "bot",
    text: "Môžeme spolu vyskladať chatbot, kalkulačku alebo 3D konfigurátor. Čo by ste chceli zákazníkom zjednodušiť?",
  },
];

const CHAT_FALLBACK =
  "Teraz sa mi nepodarilo odpovedať. Skúste to ešte raz alebo ťuknite na Kontakt.";

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAutoFocus = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function AssistantConversation({
  active,
  resetToken,
  onOpenBuilder,
}: AssistantConversationProps): JSX.Element {
  const restored = useRef(loadHistory()).current;
  const [messages, setMessages] = useState<ChatMessage[]>(
    restored?.messages.length ? restored.messages : INITIAL_MESSAGES,
  );
  const introLength = INITIAL_MESSAGES.reduce(
    (sum, message) => sum + message.text.length,
    0,
  );
  const [introChars, setIntroChars] = useState(
    restored?.messages.length || prefersReducedMotion() ? introLength : 0,
  );
  const introCursorRef = useRef(introChars);
  introCursorRef.current = introChars;
  const introComplete = introChars >= introLength;
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sendAnimating, setSendAnimating] = useState(false);
  const [composing, setComposing] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const nextIdRef = useRef(restored?.nextId ?? 3);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendAnimationTimerRef = useRef<number | null>(null);
  const requestEpochRef = useRef(0);
  const requestAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const previousActiveRef = useRef(active);

  const conversationStarted = messages.some((message) => message.from === "me");

  useEffect(() => {
    if (!active || introComplete || conversationStarted) return;
    if (prefersReducedMotion()) {
      setIntroChars(introLength);
      return;
    }
    let timer = 0;
    let cursor = introCursorRef.current;
    const advance = () => {
      cursor = Math.min(introLength, introCursorRef.current + 1);
      introCursorRef.current = cursor;
      setIntroChars(cursor);
      if (cursor >= introLength) return;
      const boundary = INITIAL_MESSAGES[0].text.length;
      const allText = INITIAL_MESSAGES.map((message) => message.text).join("");
      const pause =
        cursor === boundary
          ? 360
          : /[.!?]/.test(allText[cursor - 1])
            ? 100
            : 18;
      timer = window.setTimeout(advance, pause);
    };
    timer = window.setTimeout(advance, 160);
    return () => window.clearTimeout(timer);
  }, [active, introComplete, conversationStarted, introLength]);

  const resetTokenRef = useRef(resetToken);
  useEffect(() => {
    if (resetTokenRef.current === resetToken) return;
    resetTokenRef.current = resetToken;
    requestEpochRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    inFlightRef.current = false;
    setMessages(INITIAL_MESSAGES);
    setIntroChars(prefersReducedMotion() ? introLength : 0);
    setInput("");
    setTyping(false);
    setSendAnimating(false);
    setComposing(false);
    setMailOpen(false);
    clearHistory();
    nextIdRef.current = 3;
    if (sendAnimationTimerRef.current !== null) {
      window.clearTimeout(sendAnimationTimerRef.current);
      sendAnimationTimerRef.current = null;
    }
  }, [resetToken]);

  useEffect(
    () => () => {
      if (sendAnimationTimerRef.current !== null) {
        window.clearTimeout(sendAnimationTimerRef.current);
      }
      requestEpochRef.current += 1;
      requestAbortRef.current?.abort();
      requestAbortRef.current = null;
      inFlightRef.current = false;
    },
    [],
  );

  const streamingReply = messages.some((message) => message.streaming);

  useEffect(() => {
    if (streamingReply || typing || !introComplete) return;
    saveHistory(messages, nextIdRef.current);
  }, [messages, streamingReply, typing, introComplete]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const smooth = !prefersReducedMotion() && !streamingReply && introComplete;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, [messages, typing, streamingReply, introChars, introComplete]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const settle = window.setTimeout(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    }, 180);
    return () => window.clearTimeout(settle);
  }, [composing]);

  useEffect(() => {
    const becameActive = active && !previousActiveRef.current;
    previousActiveRef.current = active;
    if (becameActive && canAutoFocus()) {
      window.requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true }),
      );
    }
  }, [active]);

  const ask = async (question: string) => {
    if (inFlightRef.current) return;
    setIntroChars(introLength);
    inFlightRef.current = true;
    const requestEpoch = requestEpochRef.current;
    const controller = new AbortController();
    requestAbortRef.current = controller;

    const userMessage: ChatMessage = {
      id: nextIdRef.current++,
      from: "me",
      text: question,
    };
    setMessages((current) => [...current, userMessage]);
    setTyping(true);
    track("chat_message_sent", { length: question.length });

    const turns: ChatTurn[] = [...messages, userMessage].map((message) => ({
      role: message.from === "me" ? "user" : "assistant",
      text: message.text,
    }));
    const firstUser = turns.findIndex((turn) => turn.role === "user");
    const history = firstUser === -1 ? [] : turns.slice(firstUser);

    const replyId = nextIdRef.current++;
    let opened = false;
    const paint = (partial: string) => {
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      if (!opened) {
        opened = true;
        setTyping(false);
        setMessages((current) => [
          ...current,
          { id: replyId, from: "bot", text: partial, streaming: true },
        ]);
        return;
      }
      setMessages((current) =>
        current.map((message) =>
          message.id === replyId ? { ...message, text: partial } : message,
        ),
      );
    };

    let targetReply = "";
    let visibleReply = "";
    let revealTimer: number | null = null;
    let resolveDrain: (() => void) | null = null;
    const stopReveal = () => {
      if (revealTimer !== null) window.clearInterval(revealTimer);
      revealTimer = null;
      resolveDrain?.();
      resolveDrain = null;
    };
    controller.signal.addEventListener("abort", stopReveal, { once: true });
    const enqueue = (partial: string) => {
      targetReply = partial;
      if (visibleReply.length >= partial.length && visibleReply !== partial) {
        visibleReply = partial;
        paint(partial);
      }
      if (prefersReducedMotion()) {
        visibleReply = partial;
        paint(partial);
        return;
      }
      if (revealTimer !== null) return;
      revealTimer = window.setInterval(() => {
        if (controller.signal.aborted) {
          stopReveal();
          return;
        }
        if (visibleReply.length < targetReply.length) {
          const length = Math.min(targetReply.length, visibleReply.length + 4);
          visibleReply = targetReply.slice(0, length);
          paint(visibleReply);
        }
        if (visibleReply === targetReply && resolveDrain) stopReveal();
      }, 24);
    };
    const finishReveal = (text: string) => {
      enqueue(text);
      return visibleReply === text
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            resolveDrain = resolve;
          });
    };

    const settle = (text: string) => {
      setMessages((current) =>
        opened
          ? current.map((message) =>
              message.id === replyId
                ? { ...message, text, streaming: false }
                : message,
            )
          : [...current, { id: replyId, from: "bot", text }],
      );
    };

    try {
      const reply = await sendChat(
        history,
        controller.signal,
        enqueue,
        conversationId(),
      );
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      await finishReveal(reply);
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      settle(reply);
      track("chat_reply_received");
    } catch (error) {
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      settle(CHAT_FALLBACK);
      track("chat_error", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      stopReveal();
      controller.signal.removeEventListener("abort", stopReveal);
      if (requestEpoch === requestEpochRef.current) {
        requestAbortRef.current = null;
        inFlightRef.current = false;
        setTyping(false);
      }
    }
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing || streamingReply || inFlightRef.current) return;
    setInput("");
    if (!prefersReducedMotion()) {
      setSendAnimating(true);
      if (sendAnimationTimerRef.current !== null) {
        window.clearTimeout(sendAnimationTimerRef.current);
      }
      sendAnimationTimerRef.current = window.setTimeout(() => {
        sendAnimationTimerRef.current = null;
        setSendAnimating(false);
      }, 620);
    }
    void ask(value);
  };

  return (
    <div
      className="cw-conversation"
      data-testid="assistant-view"
      data-composing={composing || undefined}
      data-started={conversationStarted || undefined}
    >
      <div className="cw-scroll-shell">
        <div
          className="cw-messages"
          ref={messagesRef}
          aria-live={introComplete ? "polite" : "off"}
        >
          {messages.map((message) => {
            const prefix =
              message.id === 2 ? INITIAL_MESSAGES[0].text.length : 0;
            const greeting = !conversationStarted && message.id <= 2;
            const text = greeting
              ? message.text.slice(0, Math.max(0, introChars - prefix))
              : message.text;
            if (greeting && !text) return null;
            return (
              <div
                className={`cw-message-row cw-message-row--${message.from}`}
                data-message-id={message.id}
                data-streaming={
                  message.streaming ||
                  (greeting && introChars < prefix + message.text.length) ||
                  undefined
                }
                key={message.id}
              >
                {message.from === "bot" ? (
                  <span className="cw-avatar" aria-hidden="true">
                    <BubbleLogo size="avatar" />
                  </span>
                ) : null}
                <div className="cw-message-wrap">
                  <p>
                    {text
                      .split(/(\*\*[^*]+\*\*)/g)
                      .map((part, index) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={index}>{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={index}>{part}</span>
                        ),
                      )}
                  </p>
                  {message.from === "bot" &&
                  !message.streaming &&
                  (message.id > 2 || (message.id === 2 && introComplete)) ? (
                    <div
                      className={
                        message.id === 2
                          ? "cw-welcome-actions"
                          : "cw-reply-actions"
                      }
                      aria-label="Ďalší krok"
                    >
                      <button type="button" onClick={onOpenBuilder}>
                        Vyskladať riešenie
                      </button>
                      <button
                        type="button"
                        data-testid="open-mail-form"
                        onClick={() => setMailOpen(true)}
                      >
                        Kontakt
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {typing || (!introComplete && !conversationStarted) ? (
            <div className="cw-message-row cw-message-row--bot">
              <span className="cw-avatar" aria-hidden="true">
                <BubbleLogo size="avatar" />
              </span>
              <div
                className="cw-typing"
                role="status"
                aria-label="Píšem odpoveď"
              >
                <BrandMark size={22} tone="brand" loop />
              </div>
            </div>
          ) : null}
        </div>
        <ScrollCue targetRef={messagesRef} label="Zobraziť novšie správy" />
      </div>

      <div className="cw-inputbar" aria-busy={typing || streamingReply}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          onFocus={() => setComposing(true)}
          onBlur={() => setComposing(false)}
          placeholder="Napíšte otázku…"
          aria-label="Vaša otázka"
        />
        <button
          type="button"
          className="cw-send"
          data-waiting={typing || streamingReply || undefined}
          data-sending={sendAnimating || undefined}
          onClick={submit}
          disabled={!input.trim() || typing || streamingReply}
          aria-label="Odoslať správu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 19V5m-6 6 6-6 6 6" />
          </svg>
        </button>
      </div>

      {mailOpen ? <MessageSheet onClose={() => setMailOpen(false)} /> : null}
    </div>
  );
}
