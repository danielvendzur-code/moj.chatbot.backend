import { useEffect, useRef, useState } from "react";
import { animateChipsIn } from "../../lib/motion";
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
    text: "Dobrý deň! Som váš webový asistent. Pomôžem vám vybrať chatbota alebo kalkulačku, ktorá dáva pre váš web zmysel.",
  },
  {
    id: 2,
    from: "bot",
    text: "Najrýchlejšie začnete v konfigurátore — návrh riešenia máte do minúty. Alebo mi napíšte, čo má váš web zjednodušiť.",
  },
];

const QUICK_REPLIES: Record<string, string> = {
  "AI chatbot": "AI chatbot odpovedá návštevníkom 24/7 — zaučí sa na vaše služby, ceny aj postupy a nikdy ho nezastihnete nepripraveného.",
  "Chatbot s kalkulačkou": "Chatbot s kalkulačkou spočíta orientačnú cenu podľa vašich parametrov a rovno z nej urobí hotový dopyt s kontaktom.",
  "Rezervačný chatbot": "Rezervačný chatbot najprv zozbiera krátky dopyt, potom ponúkne termín a pošle pripomienku — bez telefonátov tam a späť.",
};

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

  useEffect(() => {
    animateChipsIn(chipsRef.current);
  }, [resetToken]);

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    nextIdRef.current = 3;
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
  }, [resetToken]);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => () => {
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
  }, []);

  const addExchange = (question: string, response: string) => {
    if (typing) return;
    setMessages((current) => [
      ...current,
      { id: nextIdRef.current++, from: "me", text: question },
    ]);
    setTyping(true);
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: nextIdRef.current++, from: "bot", text: response },
      ]);
      setTyping(false);
    }, 720);
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing) return;
    setInput("");
    addExchange(
      value,
      "Rozumiem. V ostrej verzii by som z tejto odpovede vybral vhodné riešenie a pripravil ďalší krok. Táto ukážka zatiaľ nič neodosiela — skúste konfigurátor.",
    );
  };

  return (
    <div className="cw-conversation" data-testid="assistant-view">
      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div className={`cw-message-row cw-message-row--${message.from}`} key={message.id}>
            {message.from === "bot" ? (
              <span className="cw-avatar"><BubbleLogo size="avatar" /></span>
            ) : null}
            <div className="cw-message-wrap">
              <p>{message.text}</p>
            </div>
          </div>
        ))}

        {typing ? (
          <div className="cw-message-row cw-message-row--bot">
            <span className="cw-avatar"><BubbleLogo size="avatar" /></span>
            <div className="cw-typing" aria-label="Asistent odpovedá">
              <i /><i /><i />
            </div>
          </div>
        ) : null}
      </div>

      <div className="cw-quick-replies" aria-label="Rýchle možnosti" ref={chipsRef}>
        <button type="button" className="cw-chip cw-chip--primary" onClick={onOpenCalculator}>
          Vyskladať riešenie
        </button>
        {Object.keys(QUICK_REPLIES).map((label) => (
          <button
            type="button"
            className="cw-chip"
            key={label}
            onClick={() => addExchange(label, QUICK_REPLIES[label])}
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
          aria-label="Správa pre asistenta"
        />
        <button type="button" onClick={submit} disabled={!input.trim() || typing} aria-label="Odoslať správu">
          <WidgetIcon name="send" />
        </button>
      </div>
    </div>
  );
}
