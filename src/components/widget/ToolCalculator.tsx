import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  buildProposalNumber,
  CHANNELS,
  FEATURES,
  INDUSTRIES,
  INTERESTS,
  labelOf,
  PRESET_TO_INTEREST,
  QUESTIONS,
  RECOMMENDED_FEATURES,
  STEPS,
  VOLUMES,
} from "../../lib/assistantFlow";
import type { AssistantPreset, InterestId } from "../../types/assistant";
import { WidgetIcon } from "./WidgetIcon";

type ToolCalculatorProps = {
  resetToken: number;
  initialPreset: AssistantPreset | null;
  onOpenChat: () => void;
};

type LeadState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  note: string;
  consent: boolean;
};

const EMPTY_LEAD: LeadState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  note: "",
  consent: false,
};

type SendState = "idle" | "sending" | "done";

export function ToolCalculator({
  resetToken,
  initialPreset,
  onOpenChat,
}: ToolCalculatorProps): JSX.Element {
  const initialInterest = initialPreset ? PRESET_TO_INTEREST[initialPreset] : null;

  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState<InterestId | null>(initialInterest);
  const [customText, setCustomText] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>(
    initialInterest ? RECOMMENDED_FEATURES[initialInterest] : [],
  );
  const [volume, setVolume] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadState>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [proposalNumber, setProposalNumber] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const sendTimerRef = useRef<number | null>(null);

  const restart = (nextInterest: InterestId | null) => {
    setStep(0);
    setInterest(nextInterest);
    setCustomText("");
    setIndustry(null);
    setChannel(null);
    setFeatures(nextInterest ? RECOMMENDED_FEATURES[nextInterest] : []);
    setVolume(null);
    setLead(EMPTY_LEAD);
    setLeadError("");
    setSendState("idle");
  };

  useEffect(() => {
    restart(initialPreset ? PRESET_TO_INTEREST[initialPreset] : null);
  }, [initialPreset, resetToken]);

  useEffect(() => () => {
    if (sendTimerRef.current !== null) window.clearTimeout(sendTimerRef.current);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const stepId = STEPS[step];
  const [title, subtitle] = QUESTIONS[stepId];
  const isLast = step === STEPS.length - 1;

  const featureLabels = useMemo(
    () => FEATURES.filter((option) => features.includes(option.id)).map((option) => option.label),
    [features],
  );

  const canContinue = (() => {
    switch (stepId) {
      case "interest":
        return interest !== null && (interest !== "custom" || customText.trim().length > 0);
      case "industry":
        return industry !== null;
      case "channel":
        return channel !== null;
      case "features":
        return features.length > 0;
      case "volume":
        return volume !== null;
      default:
        return true;
    }
  })();

  const pickInterest = (id: InterestId) => {
    setInterest(id);
    setFeatures((current) => (current.length > 0 ? current : RECOMMENDED_FEATURES[id]));
  };

  const toggleFeature = (id: string) => {
    setFeatures((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const submitLead = () => {
    if (sendState !== "idle") return;
    if (!lead.name.trim() || !lead.email.trim()) {
      setLeadError("Vyplňte prosím aspoň meno a e-mail.");
      return;
    }
    if (!lead.consent) {
      setLeadError("Potvrďte prosím súhlas so spracovaním údajov.");
      return;
    }
    setLeadError("");
    setSendState("sending");
    setProposalNumber(buildProposalNumber());
    sendTimerRef.current = window.setTimeout(() => setSendState("done"), 900);
  };

  const summaryRows: Array<[string, string]> = [
    ["Riešenie", interest === "custom" ? "Riešenie na mieru" : labelOf(INTERESTS, interest)],
    ["Odvetvie", labelOf(INDUSTRIES, industry)],
    ["Nasadenie", labelOf(CHANNELS, channel)],
    ["Funkcie", featureLabels.length ? featureLabels.join(", ") : "—"],
    ["Dopyty mesačne", labelOf(VOLUMES, volume)],
  ];

  if (sendState === "done") {
    return (
      <div className="cw-calculator" data-testid="calculator-view">
        <div className="cw-thanks" role="status">
          <span className="cw-thanks__icon"><WidgetIcon name="check" /></span>
          <h3>Návrh je pripravený</h3>
          <p>
            Ďakujem, <b>{lead.name.trim()}</b>. V ostrej verzii by vám teraz prišlo zhrnutie
            e-mailom — táto ukážka nič neodosiela.
          </p>
          <div className="cw-thanks__grid">
            <div><span>Riešenie</span>{summaryRows[0][1]}</div>
            <div><span>Odvetvie</span>{summaryRows[1][1]}</div>
            <div><span>Kontakt</span>{lead.email.trim()}</div>
            <div><span>Číslo návrhu</span>{proposalNumber}</div>
          </div>
          <div className="cw-thanks__actions">
            <button type="button" onClick={() => restart(null)}>
              <WidgetIcon name="reset" /> Nový návrh
            </button>
            <button type="button" className="ghost" onClick={onOpenChat}>
              Späť na asistenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-calculator" data-testid="calculator-view">
      <div className="cw-progress" aria-label={`Krok ${step + 1} z ${STEPS.length}`}>
        <button
          type="button"
          className="cw-progress__back"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0}
          aria-label="Späť"
        >
          ‹
        </button>
        <div className="cw-progress__dots" style={{ "--steps": STEPS.length } as CSSProperties}>
          {STEPS.map((id, index) => (
            <i
              key={id}
              className={
                index < step ? "done" : index === step ? "active" : ""
              }
              data-step={index + 1}
            />
          ))}
        </div>
        <span className="cw-progress__count">{step + 1}/{STEPS.length}</span>
      </div>

      <div className="cw-calc-body" ref={bodyRef}>
        <section className="cw-calc-step" key={stepId}>
          <h3 className="cw-q">{title}</h3>
          <p className="cw-q-sub">{subtitle}</p>

          {stepId === "interest" ? (
            <>
              <div className="cw-rows">
                {INTERESTS.map((option) => {
                  const selected = interest === option.id;
                  return (
                    <button
                      type="button"
                      className="cw-rowcard"
                      data-testid={`interest-${option.id}`}
                      data-selected={selected}
                      aria-pressed={selected}
                      key={option.id}
                      onClick={() => pickInterest(option.id)}
                    >
                      <span className="cw-rowcard__icon"><WidgetIcon name={option.icon} /></span>
                      <span className="cw-rowcard__body">
                        <b>{option.label}</b>
                        <span>{option.description}</span>
                      </span>
                      {option.badge ? <em className="cw-rowcard__badge">{option.badge}</em> : null}
                    </button>
                  );
                })}
              </div>
              {interest === "custom" ? (
                <div className="cw-custom">
                  <textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Napíšte pár viet o tom, čo má nástroj robiť…"
                    aria-label="Vlastná predstava"
                    rows={3}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {stepId === "industry" ? (
            <div className="cw-grid">
              {INDUSTRIES.map((option) => {
                const selected = industry === option.id;
                return (
                  <button
                    type="button"
                    className="cw-scard"
                    data-testid={`industry-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => setIndustry(option.id)}
                  >
                    <span className="cw-scard__icon"><WidgetIcon name={option.icon} /></span>
                    <b>{option.label}</b>
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "channel" ? (
            <div className="cw-list">
              {CHANNELS.map((option) => {
                const selected = channel === option.id;
                return (
                  <button
                    type="button"
                    className="cw-opt"
                    data-testid={`channel-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => setChannel(option.id)}
                  >
                    <span className="cw-opt__radio" />
                    <span className="cw-opt__body">
                      <b>{option.label}</b>
                      <span>{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "features" ? (
            <div className="cw-list">
              {FEATURES.map((option) => {
                const selected = features.includes(option.id);
                return (
                  <button
                    type="button"
                    className="cw-opt"
                    data-testid={`feature-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => toggleFeature(option.id)}
                  >
                    <span className="cw-opt__radio cw-opt__radio--square" />
                    <span className="cw-opt__body">
                      <b>{option.label}</b>
                      <span>{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "volume" ? (
            <div className="cw-grid cw-grid--volume">
              {VOLUMES.map((option) => {
                const selected = volume === option.id;
                return (
                  <button
                    type="button"
                    className="cw-vcard"
                    data-testid={`volume-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => setVolume(option.id)}
                  >
                    <b>{option.label}</b>
                    <span>{option.description}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "contact" ? (
            <>
              <div className="cw-summary">
                <span className="cw-summary__label">Váš výber</span>
                {summaryRows.map(([label, value]) => (
                  <div className="cw-summary__row" key={label}>
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
                {interest === "custom" && customText.trim() ? (
                  <div className="cw-summary__row cw-summary__row--note">
                    <span>Vaša predstava</span>
                    <b>{customText.trim()}</b>
                  </div>
                ) : null}
                <div className="cw-summary__pills">
                  <span>✓ Návrh riešenia</span>
                  <span>✓ Odhad ceny do 24 h</span>
                  <span>✓ Ukážka na mieru</span>
                  <span>✓ Bez záväzkov</span>
                </div>
              </div>

              <div className="cw-lead">
                <div className="cw-lead__head">
                  <span className="cw-lead__icon"><WidgetIcon name="mail" /></span>
                  <span>
                    <b>Kam mám poslať návrh?</b>
                    <small>Ozvem sa s návrhom a orientačnou cenou.</small>
                  </span>
                </div>
                <div className="cw-lead__form">
                  <input
                    value={lead.name}
                    onChange={(event) => setLead({ ...lead, name: event.target.value })}
                    placeholder="Meno a priezvisko *"
                    aria-label="Meno a priezvisko"
                    autoComplete="name"
                  />
                  <div className="cw-lead__row">
                    <input
                      value={lead.email}
                      onChange={(event) => setLead({ ...lead, email: event.target.value })}
                      placeholder="E-mail *"
                      aria-label="E-mail"
                      type="email"
                      autoComplete="email"
                    />
                    <input
                      value={lead.phone}
                      onChange={(event) => setLead({ ...lead, phone: event.target.value })}
                      placeholder="Telefón"
                      aria-label="Telefón"
                      autoComplete="tel"
                    />
                  </div>
                  <input
                    value={lead.company}
                    onChange={(event) => setLead({ ...lead, company: event.target.value })}
                    placeholder="Firma alebo web (nepovinné)"
                    aria-label="Firma alebo web"
                    autoComplete="organization"
                  />
                  <textarea
                    value={lead.note}
                    onChange={(event) => setLead({ ...lead, note: event.target.value })}
                    placeholder="Poznámka — termín, rozpočet, špecifiká…"
                    aria-label="Poznámka"
                    rows={2}
                  />
                  <label className="cw-consent">
                    <input
                      type="checkbox"
                      checked={lead.consent}
                      onChange={(event) => setLead({ ...lead, consent: event.target.checked })}
                    />
                    <span>Súhlasím so spracovaním údajov za účelom prípravy návrhu.</span>
                  </label>
                  {leadError ? (
                    <p className="cw-lead__status" role="alert">{leadError}</p>
                  ) : null}
                  <button
                    type="button"
                    className="cw-submit"
                    data-testid="lead-submit"
                    onClick={submitLead}
                    disabled={sendState === "sending"}
                  >
                    {sendState === "sending" ? (
                      <>
                        <span className="cw-spinner" aria-hidden="true" /> Pripravujem…
                      </>
                    ) : (
                      <>
                        <WidgetIcon name="send" /> Pripraviť návrh
                      </>
                    )}
                  </button>
                  <p className="cw-local-note">Ukážka — údaje sa neodosielajú ani neukladajú.</p>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {!isLast ? (
        <footer className="cw-calc-actions">
          <div className="cw-calc-actions__hint">
            <small>Krok {step + 1} z {STEPS.length}</small>
            <b>{interest ? (interest === "custom" ? "Na mieru" : labelOf(INTERESTS, interest)) : "Nevybrané"}</b>
          </div>
          <button
            type="button"
            className="cw-next"
            data-testid="flow-next"
            disabled={!canContinue}
            onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
          >
            Pokračovať ›
          </button>
        </footer>
      ) : (
        <footer className="cw-calc-actions">
          <button type="button" className="cw-restart" onClick={() => restart(null)}>
            ↺ Začať odznova
          </button>
        </footer>
      )}
    </div>
  );
}
