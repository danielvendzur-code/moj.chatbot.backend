import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sendChat, type ChatTurn } from "../../lib/assistantApi";
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
  flightOrigin?: FlightOrigin;
};

type FlightOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: "bot",
    text: "Dobrý deň. Napíšte mi, čo zákazníkom stále dokola vysvetľujete alebo počítate — poradím vám, ako to môže robiť váš web.",
  },
];

type QuickReply = { label: string; question: string };

const QUICK_REPLIES: QuickReply[] = [
  {
    label: "Čo mi to ušetrí?",
    question: "Čo mi chatbot na webe ušetrí v bežný pracovný deň?",
  },
  {
    label: "Ako to funguje?",
    question: "Ako to funguje na mojom webe a čo z toho uvidí zákazník?",
  },
  {
    label: "Čo mám poslať?",
    question: "Čo vám mám poslať, aby ste mi to vedeli pripraviť?",
  },
  {
    label: "Ukážte mi príklad",
    question: "Môžete mi ukázať, ako to vyzerá na skutočnom webe?",
  },
];

const CHAT_FALLBACK =
  "Teraz sa mi nepodarilo odpovedať. Skúste to prosím ešte raz alebo mi zavolajte — čísla máte nižšie.";

const QUICK_REPLY_CONFIRM_MS = 210;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rectOf = (element: HTMLElement | null): FlightOrigin | undefined => {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
};

export function AssistantConversation({
  active,
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeQuickReply, setActiveQuickReply] = useState<string | null>(null);
  const nextIdRef = useRef(2);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputbarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickReplyTimerRef = useRef<number | null>(null);
  const animatedMessageIdsRef = useRef(new Set<number>());
  const requestEpochRef = useRef(0);
  const requestAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const previousActiveRef = useRef(active);

  /* The starter questions are only useful before the conversation begins. Once
     you have asked something — by chip or by typing — they stop being an offer
     and just crowd the thread, so they go away. Reset brings them back. */
  const conversationStarted = messages.some((message) => message.from === "me");

  useEffect(() => {
    requestEpochRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    inFlightRef.current = false;
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    setActiveQuickReply(null);
    nextIdRef.current = 2;
    animatedMessageIdsRef.current.clear();
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

  useEffect(() => {
    const container = messagesRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  }, [messages, typing]);

  useEffect(() => {
    const becameActive = active && !previousActiveRef.current;
    previousActiveRef.current = active;
    if (becameActive) {
      window.requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true }),
      );
    }
  }, [active]);

  /* The real message bubble is laid out in the feed first, then animated from
     the composer/chip rect. Because this runs in a layout effect, the first
     painted frame is already at the captured origin — there is no destination
     flash and no duplicate text for assistive technology. */
  useLayoutEffect(() => {
    const message = [...messages]
      .reverse()
      .find(
        (candidate) =>
          candidate.from === "me" &&
          candidate.flightOrigin &&
          !animatedMessageIdsRef.current.has(candidate.id),
      );
    if (!message?.flightOrigin) return;

    animatedMessageIdsRef.current.add(message.id);
    if (prefersReducedMotion()) return;

    const container = messagesRef.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    const bubble = container?.querySelector<HTMLElement>(
      `[data-message-id="${message.id}"] .cw-message-wrap p`,
    );
    if (!bubble || typeof bubble.animate !== "function") return;

    const destination = bubble.getBoundingClientRect();
    const originRight = message.flightOrigin.left + message.flightOrigin.width;
    const originCenterY =
      message.flightOrigin.top + message.flightOrigin.height / 2;
    const destinationRight = destination.right;
    const destinationCenterY = destination.top + destination.height / 2;
    const deltaX = originRight - destinationRight;
    const deltaY = originCenterY - destinationCenterY;

    const animation = bubble.animate(
      [
        {
          opacity: 0.12,
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.72)`,
        },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      },
    );
    void animation.finished.then(
      () => animation.cancel(),
      () => undefined,
    );
  }, [messages]);

  const ask = async (question: string, flightOrigin?: FlightOrigin) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const requestEpoch = requestEpochRef.current;
    const controller = new AbortController();
    requestAbortRef.current = controller;

    const userMessage = {
      id: nextIdRef.current++,
      from: "me" as const,
      text: question,
      flightOrigin,
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

    try {
      const reply = await sendChat(history, controller.signal);
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, from: "bot", text: reply },
      ]);
      track("chat_reply_received");
    } catch (error) {
      if (requestEpoch !== requestEpochRef.current || controller.signal.aborted)
        return;
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, from: "bot", text: CHAT_FALLBACK },
      ]);
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
    const flightOrigin = rectOf(inputbarRef.current);
    setInput("");
    void ask(value, flightOrigin);
  };

  const chooseQuickReply = (
    button: HTMLButtonElement,
    label: string,
    question: string,
  ) => {
    if (typing || activeQuickReply) return;
    const flightOrigin = rectOf(button);
    setActiveQuickReply(label);

    const commit = () => {
      quickReplyTimerRef.current = null;
      setActiveQuickReply(null);
      void ask(question, flightOrigin);
      window.requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true }),
      );
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
    <div className="cw-conversation" data-testid="assistant-view">
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
          </span>
        </button>
      </div>

      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div
            className={`cw-message-row cw-message-row--${message.from}`}
            data-message-id={message.id}
            data-flight={message.flightOrigin ? "true" : undefined}
            key={message.id}
          >
            {message.from === "bot" ? (
              <span className="cw-avatar">
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
            <span className="cw-avatar">
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

      {conversationStarted ? null : (
        <div
          className="cw-quick-replies"
          aria-label="Na čo sa ľudia pýtajú najčastejšie"
        >
          {QUICK_REPLIES.map(({ label, question }) => {
            const sending = activeQuickReply === label;
            return (
              <button
                type="button"
                className="cw-chip"
                data-sending={sending}
                disabled={typing || activeQuickReply !== null}
                key={label}
                title={question}
                onClick={(event) =>
                  chooseQuickReply(event.currentTarget, label, question)
                }
              >
                <span className="cw-chip__label">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className="cw-inputbar"
        aria-busy={typing || activeQuickReply !== null}
        ref={inputbarRef}
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
          placeholder="Napíšte mi svoju otázku…"
          aria-label="Vaša otázka"
          disabled={activeQuickReply !== null}
        />
        <button
          type="button"
          className="cw-send"
          data-waiting={typing}
          onClick={submit}
          disabled={!input.trim() || typing || activeQuickReply !== null}
          aria-label="Odoslať správu"
        >
          <WidgetIcon name="send" />
        </button>
      </div>

      <nav className="cw-direct-actions" aria-label="Priamy kontakt">
        <div className="cw-direct-actions__grid">
          <a href="https://wa.me/421948699433" target="_blank" rel="noreferrer">
            <span className="cw-direct-actions__icon">
              <WidgetIcon name="chat" />
            </span>
            <span>WhatsApp</span>
          </a>
          <a href="tel:+421948699433">
            <span className="cw-direct-actions__icon">
              <WidgetIcon name="phone" />
            </span>
            <span>Zavolať</span>
          </a>
          <a href="mailto:daniel@vendzur.sk">
            <span className="cw-direct-actions__icon">
              <WidgetIcon name="mail" />
            </span>
            <span>E-mail</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
