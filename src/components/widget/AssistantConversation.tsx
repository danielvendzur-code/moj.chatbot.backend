import { useEffect, useRef, useState } from "react";
import { animateChipsIn, animateSentMessage } from "../../lib/motion";
import { sendChat, type ChatTurn } from "../../lib/assistantApi";
import { track } from "../../lib/analytics";
import { replayBorderTrace } from "../../lib/borderTrace";
import { BubbleLogo } from "./BubbleLogo";
import { WidgetIcon } from "./WidgetIcon";

type AssistantConversationProps = {
  resetToken: number;
  onOpenCalculator: () => void;
};

type ChatMessage = {
  id: number;
  from: "bot" | "me";
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: "bot",
    text: "Dobrý deň, som Môj Chatbot. Pomôžem vám vybrať riešenie, ktoré zodpovedá vašej službe a spôsobu predaja.",
  },
  {
    id: 2,
    from: "bot",
    text: "Môžete sa ma niečo opýtať alebo si cez „Vyskladať riešenie“ pripraviť stručné zadanie.",
  },
];

type QuickReply = { label: string; question: string };

const QUICK_REPLIES: QuickReply[] = [
  {
    label: "Ako funguje chatbot",
    question: "Ako by chatbot pomohol môjmu webu?",
  },
  { label: "Výpočet ceny", question: "Ako funguje riešenie s výpočtom ceny?" },
  {
    label: "Rezervácie",
    question: "Vie riešenie spracovať aj rezervácie termínov?",
  },
];

const CHAT_FALLBACK =
  "Prepáčte, teraz sa neviem spojiť. Skúste to o chvíľu, otvorte konfigurátor („Vyskladať riešenie“) alebo mi nechajte kontakt a ozvem sa.";

export function AssistantConversation({
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const nextIdRef = useRef(3);
  const replyTimerRef = useRef<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [planeFx, setPlaneFx] = useState(false);
  const planeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    animateChipsIn(chipsRef.current);
  }, [resetToken]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== "me") return;
    const rows = messagesRef.current?.querySelectorAll<HTMLElement>(
      ".cw-message-row--me",
    );
    animateSentMessage(rows?.[rows.length - 1] ?? null);
  }, [messages]);

  useEffect(
    () => () => {
      if (planeTimerRef.current !== null)
        window.clearTimeout(planeTimerRef.current);
    },
    [],
  );

  const launchPlane = () => {
    setPlaneFx(false);
    requestAnimationFrame(() => setPlaneFx(true));
    if (planeTimerRef.current !== null)
      window.clearTimeout(planeTimerRef.current);
    planeTimerRef.current = window.setTimeout(() => setPlaneFx(false), 700);
  };

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    nextIdRef.current = 3;
    if (replyTimerRef.current !== null)
      window.clearTimeout(replyTimerRef.current);
  }, [resetToken]);

  useEffect(() => {
    const container = messagesRef.current;
    if (container)
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(
    () => () => {
      if (replyTimerRef.current !== null)
        window.clearTimeout(replyTimerRef.current);
    },
    [],
  );

  const ask = async (question: string) => {
    if (typing) return;
    const userMessage = {
      id: nextIdRef.current++,
      from: "me" as const,
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

    try {
      const reply = await sendChat(history);
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, from: "bot", text: reply },
      ]);
      track("chat_reply_received");
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, from: "bot", text: CHAT_FALLBACK },
      ]);
      track("chat_error", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      setTyping(false);
    }
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing) return;
    setInput("");
    launchPlane();
    void ask(value);
  };

  return (
    <div className="cw-conversation" data-testid="assistant-view">
      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div
            className={`cw-message-row cw-message-row--${message.from}`}
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
            <div className="cw-typing" aria-label="Asistent odpovedá">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="cw-quick-replies"
        aria-label="Rýchle možnosti"
        ref={chipsRef}
      >
        {QUICK_REPLIES.map(({ label, question }) => (
          <button
            type="button"
            className="cw-chip"
            key={label}
            title={question}
            onClick={(event) => {
              replayBorderTrace(event.currentTarget);
              void ask(question);
            }}
          >
            <span className="cw-selection-trace" aria-hidden="true" />
            <span className="cw-chip__label">{label}</span>
          </button>
        ))}
        <button
          type="button"
          className="cw-chip cw-chip--primary"
          onClick={(event) => {
            replayBorderTrace(event.currentTarget);
            onOpenCalculator();
          }}
        >
          <span className="cw-selection-trace" aria-hidden="true" />
          <span className="cw-chip__label">Vyskladať riešenie</span>
          <WidgetIcon name="arrow" className="cw-chip__arrow" />
        </button>
      </div>

      <div className="cw-inputbar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Napíšte svoju otázku…"
          aria-label="Správa pre asistenta"
        />
        <button
          type="button"
          className={planeFx ? "is-sending" : undefined}
          onClick={submit}
          disabled={!input.trim() || typing}
          aria-label="Odoslať správu"
        >
          <WidgetIcon name="send" />
        </button>
      </div>
    </div>
  );
}
