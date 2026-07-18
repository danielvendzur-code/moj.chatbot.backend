import { useEffect, useRef, useState } from "react";
import { animateChipsIn, animateSentMessage } from "../../lib/motion";
import { BubbleLogo } from "./BubbleLogo";
import { HoverGlide } from "./HoverGlide";
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

type QuickReply = {
  label: string;
  icon: "chat" | "calculator" | "calendar";
  response: string;
};

const QUICK_REPLIES: QuickReply[] = [
  {
    label: "AI chatbot",
    icon: "chat",
    response:
      "AI chatbot odpovedá návštevníkom 24/7 — zaučí sa na vaše služby, ceny aj postupy a nikdy ho nezastihnete nepripraveného.",
  },
  {
    label: "Chatbot s kalkulačkou",
    icon: "calculator",
    response:
      "Chatbot s kalkulačkou spočíta orientačnú cenu podľa vašich parametrov a rovno z nej urobí hotový dopyt s kontaktom.",
  },
  {
    label: "Rezervačný chatbot",
    icon: "calendar",
    response:
      "Rezervačný chatbot najprv zozbiera krátky dopyt, potom ponúkne termín a pošle pripomienku — bez telefonátov tam a späť.",
  },
];

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

  /* nová odoslaná správa priletí ako lietadlo od vstupného poľa */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.from !== "me") return;
    const rows = messagesRef.current?.querySelectorAll<HTMLElement>(".cw-message-row--me");
    animateSentMessage(rows?.[rows.length - 1] ?? null);
  }, [messages]);

  useEffect(() => () => {
    if (planeTimerRef.current !== null) window.clearTimeout(planeTimerRef.current);
  }, []);

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
    launchPlane();
    addExchange(
      value,
      "Rozumiem. Najrýchlejšie sa k návrhu dostanete cez konfigurátor hore — alebo mi napíšte pár detailov a pripravím vám ho na mieru.",
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
        <HoverGlide containerRef={chipsRef} pill deps={[resetToken]} />
        <button type="button" className="cw-chip cw-chip--primary" onClick={onOpenCalculator}>
          <span className="cw-chip__icon"><WidgetIcon name="spark" /></span>
          Vyskladať riešenie
        </button>
        {QUICK_REPLIES.map(({ label, icon, response }) => (
          <button
            type="button"
            className="cw-chip"
            data-glide
            key={label}
            onClick={() => addExchange(label, response)}
          >
            <span className="cw-chip__icon"><WidgetIcon name={icon} /></span>
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
