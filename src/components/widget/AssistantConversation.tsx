import { useEffect, useRef, useState } from "react";
import { animateSentMessage } from "../../lib/motion";
import { sendChat, type ChatTurn } from "../../lib/assistantApi";
import { track } from "../../lib/analytics";
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
    text: "Dobrý deň 👋 Som AI Assistant. Pomôžem vám vybrať chatbot, kalkulačku alebo konfigurátor a pripraviť stručné zadanie. Čo vás zaujíma?",
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
  "Prepáčte, teraz sa neviem spojiť. Skúste to o chvíľu, otvorte konfigurátor alebo mi nechajte kontakt a ozvem sa.";

export function AssistantConversation({
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const nextIdRef = useRef(2);
  const replyTimerRef = useRef<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [planeFx, setPlaneFx] = useState(false);
  const planeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== "me") return;
    const rows = messagesRef.current?.querySelectorAll<HTMLElement>(".cw-message-row--me");
    animateSentMessage(rows?.[rows.length - 1] ?? null);
  }, [messages]);

  useEffect(
    () => () => {
      if (planeTimerRef.current !== null) window.clearTimeout(planeTimerRef.current);
    },
    [],
  );

  const launchPlane = () => {
    setPlaneFx(false);
    requestAnimationFrame(() => setPlaneFx(true));
    if (planeTimerRef.current !== null) window.clearTimeout(planeTimerRef.current);
    planeTimerRef.current = window.setTimeout(() => setPlaneFx(false), 700);
  };

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    nextIdRef.current = 2;
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
  }, [resetToken]);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(
    () => () => {
      if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
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

  const openCalculator = () => {
    track("chat_builder_open");
    onOpenCalculator();
  };

  return (
    <div className="cw-conversation" data-testid="assistant-view">
      <div className="cw-chat-top">
        <button type="button" className="cw-chat-builder" onClick={openCalculator}>
          <span className="cw-chat-builder__icon" aria-hidden="true">
            <WidgetIcon name="calculator" />
          </span>
          <span className="cw-chat-builder__copy">
            <b>Vyskladať riešenie</b>
            <small>Chatbot, kalkulačka alebo konfigurátor podľa vášho webu.</small>
          </span>
          <span className="cw-chat-builder__arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div className={`cw-message-row cw-message-row--${message.from}`} key={message.id}>
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
            <div className="cw-typing" aria-label="AI Assistant odpovedá">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
      </div>

      <div className="cw-quick-replies" aria-label="Rýchle možnosti">
        {QUICK_REPLIES.map(({ label, question }) => (
          <button
            type="button"
            className="cw-chip"
            key={label}
            title={question}
            onClick={() => void ask(question)}
          >
            {label}
          </button>
        ))}
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
          aria-label="Správa pre AI Assistanta"
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

      <nav className="cw-direct-actions" aria-label="Priamy kontakt">
        <span className="cw-direct-actions__label">Kontaktujte ma priamo</span>
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
