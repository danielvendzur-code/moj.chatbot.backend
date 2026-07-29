import { useEffect, useRef, useState } from "react";
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
    text:
      "Dobrý deň. Napíšte mi, čo zákazníkom stále dokola vysvetľujete alebo počítate — poradím vám, ako to môže robiť váš web.",
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

export function AssistantConversation({
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeQuickReply, setActiveQuickReply] = useState<string | null>(null);
  const nextIdRef = useRef(2);
  const messagesRef = useRef<HTMLDivElement>(null);

  /* The starter questions are only useful before the conversation begins. Once
     you have asked something — by chip or by typing — they stop being an offer
     and just crowd the thread, so they go away. Reset brings them back. */
  const conversationStarted = messages.some((message) => message.from === "me");


  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    setActiveQuickReply(null);
    nextIdRef.current = 2;
  }, [resetToken]);


  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const ask = async (question: string, quickReplyLabel: string | null = null) => {
    if (typing) return;
    if (quickReplyLabel) setActiveQuickReply(quickReplyLabel);

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
      setActiveQuickReply(null);
    }
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing) return;
    setInput("");
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
            <WidgetIcon name="spark" />
          </span>
          <span className="cw-chat-builder__copy">
            <b>Spočítať cenu za štyri otázky</b>
          </span>
        </button>
      </div>

      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div
            className={`cw-message-row cw-message-row--${message.from}`}
            data-message-id={message.id}
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
        <div className="cw-quick-replies" aria-label="Na čo sa ľudia pýtajú najčastejšie">
          {QUICK_REPLIES.map(({ label, question }) => {
            const sending = activeQuickReply === label;
            return (
              <button
                type="button"
                className="cw-chip"
                data-sending={sending}
                disabled={typing}
                key={label}
                title={question}
                onClick={() => void ask(question, label)}
              >
                <span className="cw-chip__label">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="cw-inputbar" aria-busy={typing}>
        <input
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
        />
        <button
          type="button"
          className="cw-send"
          data-waiting={typing}
          onClick={submit}
          disabled={!input.trim() || typing}
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
