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
import { WidgetIcon } from "./WidgetIcon";

type AssistantConversationProps = {
  active: boolean;
  resetToken: number;
  onOpenCalculator: () => void;
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
    text: "Dobrý deň. Napíšte mi, čo zákazníkom stále dokola vysvetľujete, počítate alebo vyberáte. Ukážem vám, čo môže web vybaviť za vás.",
  },
];

type QuickReply = { label: string; question: string };

const QUICK_REPLIES: QuickReply[] = [
  {
    label: "Kde mi to ušetrí čas?",
    question: "Kde mi chatbot alebo konfigurátor ušetrí najviac času?",
  },
  {
    label: "Ako vyzerá hotové riešenie?",
    question: "Ako vyzerá hotové riešenie na skutočnom webe?",
  },
  {
    label: "Čo odo mňa potrebujete?",
    question: "Čo vám mám poslať, aby ste mi vedeli pripraviť riešenie?",
  },
];

const CHAT_FALLBACK =
  "Teraz sa mi nepodarilo odpovedať. Skúste to ešte raz alebo použite priamy kontakt nižšie.";
const QUICK_REPLY_CONFIRM_MS = 210;
const QUICK_REPLY_HOLD_MS = 360;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAutoFocus = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function AssistantConversation({
  active,
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const restored = useRef(loadHistory()).current;
  const [messages, setMessages] = useState<ChatMessage[]>(
    restored?.messages.length ? restored.messages : INITIAL_MESSAGES,
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeQuickReply, setActiveQuickReply] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const nextIdRef = useRef(restored?.nextId ?? 2);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickReplyTimerRef = useRef<number | null>(null);
  const requestEpochRef = useRef(0);
  const requestAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const previousActiveRef = useRef(active);

  const conversationStarted = messages.some((message) => message.from === "me");
  const showQuickReplies =
    !conversationStarted || activeQuickReply !== null;

  const resetTokenRef = useRef(resetToken);
  useEffect(() => {
    if (resetTokenRef.current === resetToken) return;
    resetTokenRef.current = resetToken;
    requestEpochRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    inFlightRef.current = false;
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    setActiveQuickReply(null);
    setComposing(false);
    clearHistory();
    nextIdRef.current = 2;
    if (quickReplyTimerRef.current !== null) {
      window.clearTimeout(quickReplyTimerRef.current);
      quickReplyTimerRef.current = null;
    }
  }, [resetToken]);

  useEffect(
    () => () => {
      if (quickReplyTimerRef.current !== null) {
        window.clearTimeout(quickReplyTimerRef.current);
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
    if (streamingReply || typing) return;
    saveHistory(messages, nextIdRef.current);
  }, [messages, streamingReply, typing]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const smooth = !prefersReducedMotion() && !streamingReply;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, [messages, typing, streamingReply]);

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
        paint,
        conversationId(),
      );
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
      if (requestEpoch === requestEpochRef.current) {
        requestAbortRef.current = null;
        inFlightRef.current = false;
        setTyping(false);
      }
    }
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing || activeQuickReply) return;
    setInput("");
    void ask(value);
  };

  const chooseQuickReply = (label: string, question: string) => {
    if (typing || activeQuickReply) return;
    setActiveQuickReply(label);

    const commit = () => {
      quickReplyTimerRef.current = null;
      void ask(question);

      quickReplyTimerRef.current = window.setTimeout(() => {
        quickReplyTimerRef.current = null;
        setActiveQuickReply(null);
        if (canAutoFocus()) {
          window.requestAnimationFrame(() =>
            inputRef.current?.focus({ preventScroll: true }),
          );
        }
      }, prefersReducedMotion() ? 120 : QUICK_REPLY_HOLD_MS);
    };

    if (prefersReducedMotion()) {
      window.requestAnimationFrame(commit);
      return;
    }
    quickReplyTimerRef.current = window.setTimeout(
      commit,
      QUICK_REPLY_CONFIRM_MS,
    );
  };

  const openCalculator = () => {
    track("chat_builder_open");
    onOpenCalculator();
  };

  return (
    <div
      className="cw-conversation"
      data-testid="assistant-view"
      data-composing={composing || undefined}
      data-started={conversationStarted || undefined}
    >
      <div className="cw-chat-top">
        <button
          type="button"
          className="cw-chat-builder"
          onClick={openCalculator}
        >
          <span className="cw-chat-builder__icon" aria-hidden="true">
            <WidgetIcon name="spark" />
          </span>
          <span className="cw-chat-builder__copy">
            <b>Vyskladať riešenie</b>
            <small>4 otázky · približne 1 minúta</small>
          </span>
          <WidgetIcon name="arrow" className="cw-chat-builder__arrow" />
        </button>
      </div>

      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div
            className={`cw-message-row cw-message-row--${message.from}`}
            data-message-id={message.id}
            data-streaming={message.streaming || undefined}
            key={message.id}
          >
            {message.from === "bot" ? (
              <span className="cw-avatar" aria-hidden="true">
                <BubbleLogo size="avatar" />
              </span>
            ) : null}
            <div className="cw-message-wrap">
              <p>{message.text}</p>
            </div>
          </div>
        ))}

        {typing ? (
          <div className="cw-message-row cw-message-row--bot">
            <span className="cw-avatar" aria-hidden="true">
              <BubbleLogo size="avatar" />
            </span>
            <div className="cw-typing" role="status" aria-label="Píšem odpoveď">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
      </div>

      {showQuickReplies ? (
        <div
          className="cw-quick-replies"
          aria-label="Najčastejšie otázky"
          data-confirming={activeQuickReply !== null || undefined}
        >
          {QUICK_REPLIES.map(({ label, question }) => {
            const sending = activeQuickReply === label;
            return (
              <button
                type="button"
                className="cw-chip"
                data-sending={sending || undefined}
                aria-pressed={sending}
                disabled={typing || activeQuickReply !== null}
                key={label}
                title={question}
                onClick={() => chooseQuickReply(label, question)}
              >
                <span className="cw-chip__label">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="cw-inputbar"
        aria-busy={typing || activeQuickReply !== null}
      >
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
          placeholder="Napíšte svoju otázku…"
          aria-label="Vaša otázka"
          disabled={activeQuickReply !== null}
        />
        <button
          type="button"
          className="cw-send"
          data-waiting={typing || undefined}
          onClick={submit}
          disabled={!input.trim() || typing || activeQuickReply !== null}
          aria-label="Odoslať správu"
        >
          <WidgetIcon name="send" />
        </button>
      </div>

      <nav className="cw-direct-actions" aria-label="Priamy kontakt">
        <span className="cw-direct-actions__label">Radšej priamo?</span>
        <div className="cw-direct-actions__grid">
          <a href="https://wa.me/421948699433" target="_blank" rel="noreferrer">
            <WidgetIcon name="chat" />
            <span>WhatsApp</span>
          </a>
          <a href="tel:+421948699433">
            <WidgetIcon name="phone" />
            <span>Zavolať</span>
          </a>
          <a href="mailto:info@mojchatbot.sk">
            <WidgetIcon name="mail" />
            <span>E-mail</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
