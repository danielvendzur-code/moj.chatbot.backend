import { useEffect, useMemo, useRef, useState } from "react";
import { animateStepIn, drawCheck } from "../../lib/motion";
import { track } from "../../lib/analytics";
import { submitLead as sendLead } from "../../lib/leadApi";
import {
  buildProposalNumber,
  defaultFeatures,
  FEATURES,
  INDUSTRIES,
  INTERESTS,
  labelOf,
  PRESET_TO_INTEREST,
  QUESTIONS,
  RECOMMENDED_FEATURES,
  STEPS,
  TIMELINES,
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
  web: string;
  note: string;
  consent: boolean;
};

const EMPTY_LEAD: LeadState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  web: "",
  note: "",
  consent: false,
};

type SendState = "idle" | "sending" | "done";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SelectionIndicator({ selected }: { selected: boolean }): JSX.Element {
  return (
    <span className="cw-selection-indicator" aria-hidden="true" data-visible={selected}>
      <WidgetIcon name="check" />
    </span>
  );
}

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
  const [features, setFeatures] = useState<string[]>(defaultFeatures(initialInterest));
  const [timeline, setTimeline] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadState>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [proposalNumber, setProposalNumber] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLElement>(null);
  const thanksIconRef = useRef<HTMLSpanElement>(null);

  const restart = (nextInterest: InterestId | null) => {
    setStep(0);
    setInterest(nextInterest);
    setCustomText("");
    setIndustry(null);
    setFeatures(defaultFeatures(nextInterest));
    setTimeline(null);
    setLead(EMPTY_LEAD);
    setLeadError("");
    setSendState("idle");
  };

  useEffect(() => {
    restart(initialPreset ? PRESET_TO_INTEREST[initialPreset] : null);
  }, [initialPreset, resetToken]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    animateStepIn(stepRef.current);
    track("config_step_view", { step: STEPS[step], index: step + 1 });
  }, [step, resetToken]);

  useEffect(() => {
    if (sendState === "done") drawCheck(thanksIconRef.current);
  }, [sendState]);

  const stepId = STEPS[step];
  const [title, subtitle] = QUESTIONS[stepId];
  const isLast = step === STEPS.length - 1;

  const featureLabels = useMemo(
    () => FEATURES.filter((option) => features.includes(option.id)).map((option) => option.label),
    [features],
  );

  const selectedIndustry = useMemo(
    () => INDUSTRIES.find((option) => option.id === industry) ?? null,
    [industry],
  );

  const canContinue = (() => {
    switch (stepId) {
      case "interest":
        return interest !== null && (interest !== "custom" || customText.trim().length > 0);
      case "industry":
        return industry !== null;
      case "features":
        return features.length > 0;
      case "timeline":
        return timeline !== null;
      default:
        return true;
    }
  })();

  const pickInterest = (id: InterestId) => {
    setInterest(id);
    setFeatures((current) => [
      ...current,
      ...RECOMMENDED_FEATURES[id].filter((featureId) => !current.includes(featureId)),
    ]);
    track("config_interest_select", { interest: id });
  };

  const toggleFeature = (id: string) => {
    setFeatures((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const summaryRows: Array<[string, string]> = [
    ["Riešenie", interest === "custom" ? "Riešenie na mieru" : labelOf(INTERESTS, interest)],
    ["Odvetvie", labelOf(INDUSTRIES, industry)],
    ["Funkcie", featureLabels.length ? featureLabels.join(", ") : "—"],
    ["Spustenie", labelOf(TIMELINES, timeline)],
    ["Orientačný základ", "od 350 € — presná cena po kontrole zadania"],
  ];

  const submitLead = async () => {
    if (sendState !== "idle") return;
    const safeName = lead.name.trim();
    const safeEmail = lead.email.trim();
    if (!safeName || !EMAIL_PATTERN.test(safeEmail)) {
      setLeadError("Vyplňte prosím meno a platný e-mail.");
      return;
    }
    if (!lead.consent) {
      setLeadError("Potvrďte prosím súhlas so spracovaním údajov.");
      return;
    }

    setLeadError("");
    setSendState("sending");
    const nextProposalNumber = buildProposalNumber();
    setProposalNumber(nextProposalNumber);
    track("lead_submit", { interest, industry, timeline });

    try {
      const result = await sendLead({
        source: "widget-configurator",
        name: safeName,
        email: safeEmail,
        phone: lead.phone.trim(),
        company: lead.company.trim(),
        web: lead.web.trim(),
        note: [
          lead.note.trim(),
          interest === "custom" && customText.trim()
            ? `Vlastná predstava: ${customText.trim()}`
            : "",
          `Číslo návrhu: ${nextProposalNumber}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        interest: summaryRows[0][1],
        industry: summaryRows[1][1],
        features: featureLabels.join(", "),
        timeline: summaryRows[3][1],
        consent: true,
      });
      if (result.fallback) window.location.assign(result.fallback);
      setSendState("done");
      track("lead_submit_success");
    } catch (error) {
      setSendState("idle");
      setLeadError("Dopyt sa nepodarilo odoslať. Skúste to znova alebo použite priamy kontakt.");
      track("lead_submit_error", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  if (sendState === "done") {
    return (
      <div className="cw-calculator" data-testid="calculator-view">
        <div className="cw-thanks" role="status">
          <span className="cw-thanks__icon" ref={thanksIconRef}>
            <WidgetIcon name="check" />
          </span>
          <span className="cw-thanks__eyebrow">Zadanie je pripravené</span>
          <h3>Ďakujem, {lead.name.trim()}.</h3>
          <p>
            Ozvem sa s odporúčaným rozsahom a konkrétnou cenou zvyčajne do jedného pracovného dňa.
          </p>
          <div className="cw-thanks__grid">
            <div>
              <span>Riešenie</span>
              {summaryRows[0][1]}
            </div>
            <div>
              <span>Odvetvie</span>
              {summaryRows[1][1]}
            </div>
            <div>
              <span>Kontakt</span>
              {lead.email.trim()}
            </div>
            <div>
              <span>Číslo návrhu</span>
              {proposalNumber}
            </div>
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
          <WidgetIcon name="arrow" className="cw-back-icon" />
        </button>
        <div className="cw-progress__track">
          <span
            className="cw-progress__fill"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="cw-progress__count">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      <div className="cw-calc-body" ref={bodyRef}>
        <section className="cw-calc-step" key={stepId} ref={stepRef} data-step={stepId}>
          <header className="cw-step-head">
            <h3 className="cw-q">{title}</h3>
            <p className="cw-q-sub">{subtitle}</p>
          </header>

          {stepId === "interest" ? (
            <>
              <div className="cw-choice-grid cw-choice-grid--interest">
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
                      <span className="cw-rowcard__icon">
                        <WidgetIcon name={option.icon} />
                      </span>
                      <span className="cw-rowcard__body">
                        <b>{option.label}</b>
                        <small>{option.description}</small>
                      </span>
                      <SelectionIndicator selected={selected} />
                    </button>
                  );
                })}
              </div>
              {interest === "custom" ? (
                <div className="cw-custom">
                  <textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Stručne napíšte, čo dnes riešite ručne…"
                    aria-label="Vlastná predstava"
                    rows={3}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {stepId === "industry" ? (
            <>
              <div className="cw-choice-grid cw-choice-grid--industry">
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
                      <span className="cw-scard__icon">
                        <WidgetIcon name={option.icon} />
                      </span>
                      <b>{option.label}</b>
                      <SelectionIndicator selected={selected} />
                    </button>
                  );
                })}
              </div>
              {selectedIndustry ? (
                <aside className="cw-industry-tip" key={selectedIndustry.id} data-testid="industry-tip">
                  <b>
                    <WidgetIcon name="spark" /> Čo sa hodí pre váš typ firmy
                  </b>
                  <ul>
                    {selectedIndustry.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </>
          ) : null}

          {stepId === "features" ? (
            <div className="cw-choice-grid cw-choice-grid--features">
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
                    <span className="cw-opt__body">
                      <b>
                        {option.label}
                        {option.basic ? <em className="cw-opt__tag">Základ</em> : null}
                      </b>
                      <span>{option.description}</span>
                    </span>
                    <SelectionIndicator selected={selected} />
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "timeline" ? (
            <div className="cw-choice-grid cw-choice-grid--timeline">
              {TIMELINES.map((option) => {
                const selected = timeline === option.id;
                return (
                  <button
                    type="button"
                    className="cw-vcard"
                    data-testid={`timeline-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => setTimeline(option.id)}
                  >
                    <b>{option.label}</b>
                    <span>{option.description}</span>
                    <SelectionIndicator selected={selected} />
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "contact" ? (
            <div className="cw-contact-stage">
              <div className="cw-lead">
                <div className="cw-lead__head">
                  <span className="cw-lead__icon">
                    <WidgetIcon name="mail" />
                  </span>
                  <span>
                    <b>Získať konkrétny návrh</b>
                    <small>Jednoduchý chatbot začína od 350 €.</small>
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
                  <details className="cw-lead__optional">
                    <summary>Doplniť firmu, web alebo poznámku</summary>
                    <div className="cw-lead__optional-body">
                      <div className="cw-lead__row">
                        <input
                          value={lead.company}
                          onChange={(event) => setLead({ ...lead, company: event.target.value })}
                          placeholder="Firma"
                          aria-label="Firma"
                          autoComplete="organization"
                        />
                        <input
                          value={lead.web}
                          onChange={(event) => setLead({ ...lead, web: event.target.value })}
                          placeholder="vasafirma.sk"
                          aria-label="Adresa webu"
                          autoComplete="url"
                          inputMode="url"
                        />
                      </div>
                      <textarea
                        value={lead.note}
                        onChange={(event) => setLead({ ...lead, note: event.target.value })}
                        placeholder="Poznámka alebo dôležitý termín…"
                        aria-label="Poznámka"
                        rows={2}
                      />
                    </div>
                  </details>
                  <label className="cw-consent">
                    <input
                      type="checkbox"
                      checked={lead.consent}
                      onChange={(event) => setLead({ ...lead, consent: event.target.checked })}
                    />
                    <span>Súhlasím so spracovaním údajov na prípravu návrhu.</span>
                  </label>
                  {leadError ? (
                    <p className="cw-lead__status" role="alert">
                      {leadError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="cw-submit"
                    data-testid="lead-submit"
                    onClick={() => void submitLead()}
                    disabled={sendState === "sending"}
                  >
                    {sendState === "sending" ? (
                      <>
                        <span className="cw-spinner" aria-hidden="true" /> Odosielam…
                      </>
                    ) : (
                      <>
                        <WidgetIcon name="send" /> Poslať zadanie
                      </>
                    )}
                  </button>
                  <p className="cw-local-note">Odpoveď zvyčajne do 1 pracovného dňa. Bez záväzku.</p>
                </div>
              </div>

              <div className="cw-summary">
                <span className="cw-summary__label">Vaše zadanie</span>
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
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {!isLast ? (
        <footer className="cw-calc-actions">
          <button
            type="button"
            className="cw-next"
            data-testid="flow-next"
            disabled={!canContinue}
            onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
          >
            <span>Pokračovať</span>
            <WidgetIcon name="arrow" />
          </button>
        </footer>
      ) : (
        <footer className="cw-calc-actions cw-calc-actions--final">
          <button type="button" className="cw-restart" onClick={() => restart(null)}>
            <WidgetIcon name="reset" /> Začať odznova
          </button>
        </footer>
      )}
    </div>
  );
}
