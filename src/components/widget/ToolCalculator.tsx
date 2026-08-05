import { useEffect, useMemo, useRef, useState } from "react";
import { drawCheck } from "../../lib/motion";
import { track } from "../../lib/analytics";
import { submitLead as sendLead } from "../../lib/leadApi";
import { useStepTransition } from "../../hooks/useStepTransition";
import {
  buildProposalNumber,
  FEATURES,
  INDUSTRIES,
  INTERESTS,
  labelOf,
  PRESET_TO_INTEREST,
  QUESTION_STEPS,
  QUESTIONS,
  RECOMMENDED_FEATURES,
  STEPS,
  TIMELINES,
} from "../../lib/assistantFlow";
import type { AssistantPreset, InterestId } from "../../types/assistant";
import { ScrollCue } from "./ScrollCue";
import { WidgetIcon } from "./WidgetIcon";

type ToolCalculatorProps = {
  active: boolean;
  resetToken: number;
  initialPreset: AssistantPreset | null;
  onOpenChat: () => void;
};

type ContactMethod = "video" | "phone" | "email";

type LeadState = {
  contactMethod: ContactMethod | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  web: string;
  note: string;
  consent: boolean;
};

const EMPTY_LEAD: LeadState = {
  contactMethod: null,
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

const CONTACT_METHODS: Array<{
  id: ContactMethod;
  label: string;
  icon: "chat" | "phone" | "mail";
}> = [
  { id: "phone", label: "Telefonicky", icon: "phone" },
  { id: "email", label: "E-mailom", icon: "mail" },
  { id: "video", label: "Videohovor", icon: "chat" },
];

const isTextField = (element: HTMLElement): boolean =>
  element instanceof HTMLInputElement
    ? element.type !== "checkbox" && element.type !== "radio"
    : element instanceof HTMLTextAreaElement;

function SelectionIndicator({ selected }: { selected: boolean }): JSX.Element {
  return (
    <span
      className="cw-selection-indicator"
      aria-hidden="true"
      data-visible={selected}
    >
      <WidgetIcon name="check" />
    </span>
  );
}

export function ToolCalculator({
  active,
  resetToken,
  initialPreset,
  onOpenChat,
}: ToolCalculatorProps): JSX.Element {
  const initialInterest = initialPreset
    ? PRESET_TO_INTEREST[initialPreset]
    : null;

  const [step, setStep] = useState(0);
  const [composing, setComposing] = useState(false);
  const [interest, setInterest] = useState<InterestId | null>(initialInterest);
  const [customText, setCustomText] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadState>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [handedToMailClient, setHandedToMailClient] = useState(false);
  const [proposalNumber, setProposalNumber] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const previousVisibleStepRef = useRef(0);
  const previousActiveRef = useRef(active);
  const thanksIconRef = useRef<HTMLSpanElement>(null);

  const { visibleStep, leaving, direction } = useStepTransition(step, bodyRef);

  const restart = (nextInterest: InterestId | null) => {
    setStep(0);
    setInterest(nextInterest);
    setCustomText("");
    setIndustry(null);
    setFeatures([]);
    setTimeline(null);
    setLead(EMPTY_LEAD);
    setLeadError("");
    setValidationAttempted(false);
    setSendState("idle");
    setHandedToMailClient(false);
  };

  useEffect(() => {
    restart(initialPreset ? PRESET_TO_INTEREST[initialPreset] : null);
  }, [initialPreset, resetToken]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    const stepChanged = previousVisibleStepRef.current !== visibleStep;
    const becameActive = active && !previousActiveRef.current;
    previousVisibleStepRef.current = visibleStep;
    previousActiveRef.current = active;
    if ((stepChanged || becameActive) && active) {
      window.requestAnimationFrame(() =>
        questionRef.current?.focus({ preventScroll: true }),
      );
    }
    track("config_step_view", {
      step: STEPS[visibleStep],
      index: visibleStep + 1,
    });
  }, [active, visibleStep, resetToken]);

  useEffect(() => {
    if (sendState === "done") drawCheck(thanksIconRef.current);
  }, [sendState]);

  const stepId = STEPS[visibleStep];
  const [title, subtitle] = QUESTIONS[stepId];
  const isLast = visibleStep === STEPS.length - 1;
  const questionIndex = QUESTION_STEPS.indexOf(stepId);

  const featureLabels = useMemo(
    () =>
      FEATURES.filter((option) => features.includes(option.id)).map(
        (option) => option.label,
      ),
    [features],
  );

  const canContinue = (() => {
    if (leaving) return false;
    switch (stepId) {
      case "interest":
        return (
          interest !== null &&
          (interest !== "custom" || customText.trim().length > 0)
        );
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
    track("config_interest_select", { interest: id });
  };

  const recommendedLabels = (interest ? RECOMMENDED_FEATURES[interest] : [])
    .map((id) => FEATURES.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  const toggleFeature = (id: string) => {
    setFeatures((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const updateLead = (patch: Partial<LeadState>) => {
    setLead((current) => ({ ...current, ...patch }));
    if (leadError) setLeadError("");
  };

  const summaryRows: Array<[string, string]> = [
    [
      "Web má",
      interest === "custom"
        ? "Poradiť mi, čo sa hodí"
        : labelOf(INTERESTS, interest),
    ],
    ["Vaša firma", labelOf(INDUSTRIES, industry)],
    ["Má zvládnuť", featureLabels.length ? featureLabels.join(", ") : "—"],
    ["Hotové", labelOf(TIMELINES, timeline)],
  ];

  const safeName = lead.name.trim();
  const safeEmail = lead.email.trim();
  const safePhone = lead.phone.trim();
  const hasValidEmail = safeEmail ? EMAIL_PATTERN.test(safeEmail) : false;
  const contactMethodInvalid = validationAttempted && !lead.contactMethod;
  const nameInvalid = validationAttempted && !safeName;
  const emailInvalid =
    validationAttempted &&
    ((Boolean(safeEmail) && !hasValidEmail) ||
      (lead.contactMethod === "email" && !hasValidEmail));
  const phoneInvalid =
    validationAttempted &&
    lead.contactMethod !== "email" &&
    !safePhone &&
    !hasValidEmail;

  const submitLead = async () => {
    if (sendState !== "idle") return;
    setValidationAttempted(true);

    if (!lead.contactMethod) {
      setLeadError("Vyberte, ako sa vám mám ozvať.");
      return;
    }
    if (!safeName) {
      setLeadError("Napíšte mi prosím svoje meno.");
      return;
    }
    if (safeEmail && !hasValidEmail) {
      setLeadError("Skontrolujte prosím e-mail, niečo v ňom chýba.");
      return;
    }
    if (lead.contactMethod === "email" && !hasValidEmail) {
      setLeadError("Napíšte e-mail, na ktorý vám môžem odpovedať.");
      return;
    }
    if (lead.contactMethod !== "email" && !safePhone && !hasValidEmail) {
      setLeadError("Napíšte telefón alebo e-mail, aby som sa vám vedel ozvať.");
      return;
    }
    if (!lead.consent) {
      setLeadError("Potvrďte prosím, že vás môžem kontaktovať.");
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
        phone: safePhone,
        company: lead.company.trim(),
        web: lead.web.trim(),
        note: [
          lead.note.trim(),
          interest === "custom" && customText.trim()
            ? `Čo dnes riešia ručne: ${customText.trim()}`
            : "",
          `Ozvať sa takto: ${CONTACT_METHODS.find((item) => item.id === lead.contactMethod)?.label ?? lead.contactMethod}`,
          `Číslo dopytu: ${nextProposalNumber}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        interest: summaryRows[0][1],
        industry: summaryRows[1][1],
        features: featureLabels.join(", "),
        timeline: summaryRows[3][1],
        reference: nextProposalNumber,
        consent: true,
      });
      setHandedToMailClient(!result.delivered);
      if (result.fallback) window.location.assign(result.fallback);
      setSendState("done");
      track("lead_submit_success", { delivered: result.delivered });
    } catch (error) {
      setSendState("idle");
      setLeadError(
        "Nepodarilo sa to poslať. Skúste to ešte raz alebo mi zavolajte.",
      );
      track("lead_submit_error", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  if (sendState === "done") {
    return (
      <div
        className="cw-calculator"
        data-view="thanks"
        data-testid="calculator-view"
      >
        <div className="cw-thanks" role="status">
          <span className="cw-thanks__icon" ref={thanksIconRef}>
            <WidgetIcon name="check" />
          </span>
          <span className="cw-thanks__eyebrow">
            {handedToMailClient ? "Skoro hotovo" : "Dopyt je odoslaný"}
          </span>
          <h3>Ďakujem, {safeName}.</h3>
          <p>
            {handedToMailClient
              ? "Otvoril som vám pripravený e-mail. Stačí ho odoslať a ozvem sa do jedného pracovného dňa."
              : hasValidEmail
                ? "Potvrdenie som poslal na e-mail. Ozvem sa do jedného pracovného dňa s konkrétnym ďalším krokom."
                : "Ozvem sa do jedného pracovného dňa s konkrétnym ďalším krokom."}
          </p>
          <div className="cw-thanks__summary">
            <div>
              <span>Riešenie</span>
              <strong>{summaryRows[0][1]}</strong>
            </div>
            <div>
              <span>Kontakt</span>
              <strong>{safePhone || safeEmail}</strong>
            </div>
            <div>
              <span>Číslo dopytu</span>
              <strong>{proposalNumber}</strong>
            </div>
          </div>
          <div className="cw-thanks__actions">
            <button type="button" onClick={() => restart(null)}>
              <WidgetIcon name="reset" /> Vyskladať znova
            </button>
            <button type="button" className="ghost" onClick={onOpenChat}>
              Mám ešte otázku
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cw-calculator"
      data-view="steps"
      data-testid="calculator-view"
      data-composing={composing || undefined}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLElement && isTextField(event.target)) {
          setComposing(true);
        }
      }}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof HTMLElement) || !isTextField(next)) {
          setComposing(false);
        }
      }}
    >
      <div className="cw-progress">
        <button
          type="button"
          className="cw-progress__back"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0 || leaving}
          aria-label="Späť na predchádzajúcu otázku"
        >
          <WidgetIcon name="arrow" className="cw-back-icon" />
        </button>
        <div className="cw-progress__main">
          <span className="cw-progress__count" aria-live="polite">
            {questionIndex === -1
              ? `Krok ${visibleStep + 1} z ${STEPS.length} · Kontakt`
              : `Otázka ${questionIndex + 1} zo ${QUESTION_STEPS.length}`}
          </span>
          <div className="cw-progress__dots" aria-hidden="true">
            {STEPS.map((item, index) => (
              <i
                key={item}
                data-current={index === visibleStep || undefined}
                data-complete={index < visibleStep || undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="cw-scroll-shell">
        <div className="cw-calc-body" ref={bodyRef}>
        <section
          className="cw-calc-step"
          key={stepId}
          data-step={stepId}
          data-leaving={leaving || undefined}
          data-direction={direction}
        >
          <header className="cw-step-head">
            <h3 className="cw-q" ref={questionRef} tabIndex={-1}>
              {title}
            </h3>
            <p className="cw-q-sub">
              {subtitle}
              {stepId === "features" && recommendedLabels.length ? (
                <>
                  {" "}
                  Najčastejšie sa k tomu hodí{" "}
                  <b>{recommendedLabels.join(" a ").toLowerCase()}</b>.
                </>
              ) : null}
            </p>
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
                      key={`${stepId}-${option.id}`}
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
                <label className="cw-custom">
                  <span>Čo vás dnes najviac zdržuje?</span>
                  <textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Napríklad opakované otázky, cenové ponuky alebo výber produktu…"
                    rows={3}
                  />
                </label>
              ) : null}
            </>
          ) : null}

          {stepId === "industry" ? (
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
                    key={`${stepId}-${option.id}`}
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
                    key={`${stepId}-${option.id}`}
                    onClick={() => toggleFeature(option.id)}
                  >
                    <span className="cw-opt__body">
                      <b>{option.label}</b>
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
                    key={`${stepId}-${option.id}`}
                    onClick={() => setTimeline(option.id)}
                  >
                    <span className="cw-vcard__copy">
                      <b>{option.label}</b>
                      <span>{option.description}</span>
                    </span>
                    <SelectionIndicator selected={selected} />
                  </button>
                );
              })}
            </div>
          ) : null}

          {stepId === "contact" ? (
            <div className="cw-contact-stage">
              <div className="cw-lead">
                {/* One compact segmented row instead of three tall cards and a
                    three-line intro: the whole contact step has to fit without
                    scrolling, and the step heading already asks the question. */}
                <div
                  className="cw-contact-methods"
                  role="group"
                  aria-label="Ako sa vám mám ozvať"
                  aria-invalid={contactMethodInvalid}
                >
                  {CONTACT_METHODS.map((method) => {
                    const selected = lead.contactMethod === method.id;
                    return (
                      <button
                        type="button"
                        className="cw-contact-method"
                        data-selected={selected}
                        aria-pressed={selected}
                        key={`${stepId}-${method.id}`}
                        onClick={() => updateLead({ contactMethod: method.id })}
                      >
                        <WidgetIcon name={method.icon} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="cw-lead__form">
                  <label className="cw-field">
                    <span>Meno <em>*</em></span>
                    <input
                      value={lead.name}
                      onChange={(event) => updateLead({ name: event.target.value })}
                      placeholder="Vaše meno"
                      autoComplete="name"
                      aria-invalid={nameInvalid}
                      aria-describedby={leadError ? "cw-lead-error" : undefined}
                    />
                  </label>
                  <div className="cw-lead__row">
                    <label className="cw-field">
                      <span>E-mail {lead.contactMethod === "email" ? <em>*</em> : null}</span>
                      <input
                        value={lead.email}
                        onChange={(event) => updateLead({ email: event.target.value })}
                        placeholder="meno@firma.sk"
                        type="email"
                        autoComplete="email"
                        aria-invalid={emailInvalid}
                        aria-describedby={leadError ? "cw-lead-error" : undefined}
                      />
                    </label>
                    <label className="cw-field">
                      <span>Telefón {lead.contactMethod !== "email" ? <em>*</em> : null}</span>
                      <input
                        value={lead.phone}
                        onChange={(event) => updateLead({ phone: event.target.value })}
                        placeholder="+421 …"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={phoneInvalid}
                        aria-describedby={leadError ? "cw-lead-error" : undefined}
                      />
                    </label>
                  </div>

                  <details className="cw-lead__optional">
                    <summary>Pridať firmu, web alebo poznámku</summary>
                    <div className="cw-lead__optional-body">
                      <div className="cw-lead__row">
                        <label className="cw-field">
                          <span>Firma</span>
                          <input
                            value={lead.company}
                            onChange={(event) => updateLead({ company: event.target.value })}
                            placeholder="Názov firmy"
                            autoComplete="organization"
                          />
                        </label>
                        <label className="cw-field">
                          <span>Web</span>
                          <input
                            value={lead.web}
                            onChange={(event) => updateLead({ web: event.target.value })}
                            placeholder="vasafirma.sk"
                            autoComplete="url"
                            inputMode="url"
                          />
                        </label>
                      </div>
                      <label className="cw-field">
                        <span>Poznámka</span>
                        <textarea
                          value={lead.note}
                          onChange={(event) => updateLead({ note: event.target.value })}
                          placeholder="Čo by som mal ešte vedieť?"
                          rows={2}
                        />
                      </label>
                    </div>
                  </details>
                </div>
              </div>

              <details className="cw-summary">
                <summary>
                  <span>Váš výber</span>
                  <small>{summaryRows.length} položky</small>
                </summary>
                <div className="cw-summary__body">
                  {summaryRows.map(([label, value]) => (
                    <div className="cw-summary__row" key={label}>
                      <span>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                  {interest === "custom" && customText.trim() ? (
                    <div className="cw-summary__row cw-summary__row--note">
                      <span>Napísali ste</span>
                      <b>{customText.trim()}</b>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          ) : null}
          </section>
        </div>
        <ScrollCue targetRef={bodyRef} />
      </div>

      {!isLast ? (
        <footer className="cw-calc-actions">
          <button
            type="button"
            className="cw-next"
            data-testid="flow-next"
            disabled={!canContinue}
            onClick={() =>
              setStep((value) => Math.min(STEPS.length - 1, value + 1))
            }
          >
            <span>Pokračovať</span>
            <WidgetIcon name="arrow" />
          </button>
        </footer>
      ) : (
        <footer className="cw-calc-actions cw-calc-actions--final">
          {leadError ? (
            <p className="cw-lead__status" id="cw-lead-error" role="alert">
              {leadError}
            </p>
          ) : null}
          <label className="cw-consent" data-checked={lead.consent}>
            <input
              type="checkbox"
              checked={lead.consent}
              onChange={(event) => updateLead({ consent: event.target.checked })}
            />
            <span className="cw-consent__box" aria-hidden="true">
              <WidgetIcon name="check" />
            </span>
            <span className="cw-consent__text">
              Súhlasím, že ma môžete kontaktovať.
            </span>
          </label>
          <button
            type="button"
            className="cw-submit cw-submit--approved"
            data-testid="lead-submit"
            data-state={sendState}
            onClick={() => void submitLead()}
            disabled={sendState === "sending"}
          >
            <span className="cw-submit__content">
              {sendState === "sending" ? (
                <>
                  <span className="cw-spinner" aria-hidden="true" /> Posielam…
                </>
              ) : (
                <>
                  <WidgetIcon name="send" /> Poslať nezáväzný dopyt
                </>
              )}
            </span>
          </button>
        </footer>
      )}
    </div>
  );
}