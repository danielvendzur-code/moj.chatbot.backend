import { useEffect, useRef, useState } from "react";
import type { FlyCatchPhase } from "../../hooks/useFlyCatch";
import { ChameleonSprite } from "./ChameleonSprite";
import { WidgetIcon } from "./WidgetIcon";

type AssistantConversationProps = {
  phase: FlyCatchPhase;
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
    text: "Dobrý deň. Pomôžem vám vybrať digitálny nástroj, ktorý dáva zmysel pre váš web.",
  },
  {
    id: 2,
    from: "bot",
    text: "Najrýchlejšie začnete v kalkulačke návrhu. Alebo mi napíšte, čo má váš web zjednodušiť.",
  },
];

const QUICK_REPLIES: Record<string, string> = {
  "Presné dopyty": "Dopytový asistent vie zozbierať rozsah, lokalitu, termín, fotografie aj kontakt ešte pred prvým telefonátom.",
  "Výber produktu": "Produktový poradca odporučí vhodnú možnosť podľa použitia, rozpočtu, veľkosti a ďalších rozhodovacích kritérií.",
  Rezervácia: "Rezervácia môže prísť až po krátkom dopyte, výbere služby alebo lokality, aby mal termín správny kontext.",
};

export function AssistantConversation({
  phase,
  resetToken,
  onOpenCalculator,
}: AssistantConversationProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const nextIdRef = useRef(3);
  const replyTimerRef = useRef<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setTyping(false);
    setContactStatus("");
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
    }, 620);
  };

  const submit = () => {
    const value = input.trim();
    if (!value || typing) return;
    setInput("");
    addExchange(
      value,
      "Rozumiem. V ostrej verzii by som túto odpoveď použil na výber vhodného flow a pripravil konkrétny ďalší krok. Táto ukážka zatiaľ nič neodosiela.",
    );
  };

  return (
    <div className="cw-conversation" data-testid="assistant-view">
      <div className="cw-messages" ref={messagesRef} aria-live="polite">
        {messages.map((message) => (
          <div className={`cw-message-row cw-message-row--${message.from}`} key={message.id}>
            {message.from === "bot" ? (
              <span className="cw-avatar"><ChameleonSprite phase={phase} size="avatar" /></span>
            ) : null}
            <div className="cw-message-wrap">
              <p>{message.text}</p>
              <small>{message.from === "bot" ? "Asistent" : "Vy"}</small>
            </div>
          </div>
        ))}

        {typing ? (
          <div className="cw-message-row cw-message-row--bot">
            <span className="cw-avatar"><ChameleonSprite phase={phase} size="avatar" /></span>
            <div className="cw-typing" aria-label="Asistent odpovedá">
              <i /><i /><i />
            </div>
          </div>
        ) : null}
      </div>

      <div className="cw-quick-replies" aria-label="Rýchle možnosti">
        <span className="cw-quick-replies__label">Rýchly štart</span>
        <button type="button" onClick={onOpenCalculator}>Vyskladať nástroj</button>
        {Object.keys(QUICK_REPLIES).map((label) => (
          <button
            type="button"
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
          placeholder="Napíšte, čo chcete vyriešiť…"
          aria-label="Správa pre asistenta"
        />
        <button type="button" onClick={submit} disabled={!input.trim() || typing} aria-label="Odoslať správu">
          <WidgetIcon name="send" />
        </button>
      </div>

      <div className="cw-contactbar">
        <span className="cw-contactbar__label"><WidgetIcon name="spark" /> Ukážka neodosiela žiadne údaje</span>
        <div>
          <button type="button" onClick={() => setContactStatus("E-mail sa zapojí v ďalšej fáze.")}>
            <WidgetIcon name="mail" /> E-mail
          </button>
          <button type="button" onClick={() => setContactStatus("Termín sa zatiaľ nerezervuje.")}>
            <WidgetIcon name="user" /> Konzultácia
          </button>
          <button type="button" onClick={() => setContactStatus("Brief zostáva iba v tejto ukážke.")}>
            <WidgetIcon name="spark" /> Brief
          </button>
        </div>
        {contactStatus ? <p role="status">{contactStatus}</p> : null}
      </div>
    </div>
  );
}
