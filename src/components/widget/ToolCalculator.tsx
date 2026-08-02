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
import { WidgetIcon } from "./WidgetIcon";

type ToolCalculatorProps = {
  active: boolean;
  resetToken: number;
  initialPreset: AssistantPreset | null;
  onOpenChat: () => void;
};

type ContactMethod = "video" | "phone" | "meeting" | "email";

type LeadState = {
  /* Starts empty on purpose: a method that looks picked before the visitor
     touched anything reads as a highlighted chip nobody chose. */
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
  icon: "chat" | "phone" | "user" | "mail";
}> = [
  { id: "phone", label: "Telefonicky", icon: "phone" },
  { id: "video", label: "Cez video", icon: "chat" },
  { id: "meeting", label: "Osobne", icon: "user" },
  { id: "email", label: "E-mailom", icon: "mail" },
];

/* Only a control that summons the keyboard should fold the panel; a tap on a
   choice card or the Next button must leave the layout alone. */
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
  /* The contact step is the one with a keyboard in front of it. On a phone the
     panel shrinks to the space above that keyboard — around 380px — and the
     header, mode switch and progress row alone eat 298 of it, leaving 64px of
     form. The visitor ends up typing into a field they cannot see. While a
     field here has focus the stylesheet folds the switch and the progress row
     away; both come back the moment it is released. */
  const [composing, setComposing] = useState(false);
  const [interest, setInterest] = useState<InterestId | null>(initialInterest);
  const [customText, setCustomText] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadState>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [handedToMailClient, setHandedToMailClient] = useState(false);
  const [proposalNumber, setProposalNumber] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const previousVisibleStepRef = useRef(0);
  const previousActiveRef = useRef(active);
  const thanksIconRef = useRef<HTMLSpanElement>(null);

  /* The outgoing step fades up and out before the new one arrives from below,
     and the body holds its height across the swap so nothing jumps. */
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
    setSendState("idle");
    setHandedToMailClient(false);
  };

  useEffect(() => {
    restart(initialPreset ? PRESET_TO_INTEREST[initialPreset] : null);
  }, [initialPreset, resetToken]);

  /* Move keyboard and assistive-technology users to the question that just
     arrived. This replaces the old bare blur, which dropped focus on <body>. */
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

  /* The bar is driven by a number so CSS can ease it instead of jumping. */
  const progress = ((visibleStep + 1) / STEPS.length) * 100;

  const featureLabels = useMemo(
    () =>
      FEATURES.filter((option) => features.includes(option.id)).map(
        (option) => option.label,
      ),
    [features],
  );

  const selectedIndustry = useMemo(
    () => INDUSTRIES.find((option) => option.id === industry) ?? null,
    [industry],
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

  /* Picking a goal no longer ticks feature boxes for the visitor. */
  const pickInterest = (id: InterestId) => {
    setInterest(id);
    track("config_interest_select", { interest: id });
  };

  /* The suggestion belongs in the sentence above the options, never as a mark on
     one of them. */
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

  const submitLead = async () => {
    if (sendState !== "idle") return;
    const safeName = lead.name.trim();
    const safeEmail = lead.email.trim();
    const safePhone = lead.phone.trim();
    const hasValidEmail = safeEmail ? EMAIL_PATTERN.test(safeEmail) : false;
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
      setLeadError("Potvrďte prosím, že vám môžem napísať.");
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
      /* When the server could not deliver, the visitor's own mail client is
         opened with everything already filled in. The thank-you screen then
         says so plainly rather than claiming a send that did not happen. */
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
    /* The step view lays this container out as a three-row grid (progress, body,
       actions). The thank-you screen is a single block, so it says which view it
       is and gets its own layout instead of being squeezed into the 48px
       progress row. */
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
            {handedToMailClient ? "Skoro hotovo" : "Hotovo, poslal som to"}
          </span>
          <h3>Ďakujem, {lead.name.trim()}.</h3>
          <p>
            {handedToMailClient
              ? "Otvoril som vám rozpísaný e-mail — stačí ho odoslať a ozvem sa do jedného pracovného dňa."
              : EMAIL_PATTERN.test(lead.email.trim())
                ? "Potvrdenie som vám poslal na e-mail a ozvem sa do jedného pracovného dňa."
                : "Ozvem sa vám do jedného pracovného dňa s návrhom ďalšieho kroku."}
          </p>
          <div className="cw-thanks__grid">
            <div>
              <span>Web má</span>
              {summaryRows[0][1]}
            </div>
            <div>
              <span>Má zvládnuť</span>
              {featureLabels.length ? featureLabels.join(", ") : "Podľa dohody"}
            </div>
            <div>
              <span>Ozvem sa na</span>
              {lead.phone.trim() || lead.email.trim()}
            </div>
            <div>
              <span>Číslo dopytu</span>
              {proposalNumber}
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
      /* Focus events bubble here, so one pair of handlers covers every field
         on the step — including the ones inside the optional details block. */
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLElement && isTextField(event.target)) {
          setComposing(true);
        }
      }}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        /* Moving between two fields is still composing; only leaving the form
           for something that is not a field puts the panel back. */
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
        <div className="cw-progress__track">
          <span
            className="cw-progress__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* One live region, so the label is spoken once per step instead of
            reading a bare fraction. */}
        <span className="cw-progress__count" aria-live="polite">
          {questionIndex === -1
            ? "Posledný krok"
            : `Otázka ${questionIndex + 1} zo ${QUESTION_STEPS.length}`}
        </span>
      </div>

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
                  Pri tom, čo ste vybrali, sa najviac hodí{" "}
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
                <div className="cw-custom">
                  <textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="Napíšte, čo vás dnes najviac zdržuje…"
                    aria-label="Čo vás dnes zdržuje"
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
              {selectedIndustry ? (
                <aside
                  className="cw-industry-tip"
                  key={selectedIndustry.id}
                  data-testid="industry-tip"
                >
                  <b>
                    <WidgetIcon name="spark" /> Toto sa u vás najviac oplatí
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
            <>
              <div className="cw-choice-grid cw-choice-grid--features">
                {/* No badges, hints or highlights here. Every option on a fresh
                    step has to look exactly like every other option — the moment
                    one of them stands out, it reads as already chosen. */}
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
            </>
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
                <span className="cw-lead__ask">Ako sa vám mám ozvať?</span>
                <div
                  className="cw-contact-methods"
                  role="group"
                  aria-label="Ako sa vám mám ozvať"
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
                        onClick={() =>
                          setLead({ ...lead, contactMethod: method.id })
                        }
                      >
                        <WidgetIcon name={method.icon} />
                        <span>{method.label}</span>
                        {selected ? (
                          <WidgetIcon
                            name="check"
                            className="cw-contact-method__check"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="cw-lead__form">
                  <input
                    value={lead.name}
                    onChange={(event) =>
                      setLead({ ...lead, name: event.target.value })
                    }
                    placeholder="Meno *"
                    aria-label="Vaše meno"
                    autoComplete="name"
                  />
                  <div className="cw-lead__row">
                    <input
                      value={lead.email}
                      onChange={(event) =>
                        setLead({ ...lead, email: event.target.value })
                      }
                      placeholder={
                        lead.contactMethod === "email"
                          ? "Váš e-mail *"
                          : "Váš e-mail"
                      }
                      aria-label="Váš e-mail"
                      type="email"
                      autoComplete="email"
                    />
                    <input
                      value={lead.phone}
                      onChange={(event) =>
                        setLead({ ...lead, phone: event.target.value })
                      }
                      placeholder={
                        lead.contactMethod === "email"
                          ? "Vaše číslo"
                          : "Vaše číslo *"
                      }
                      aria-label="Vaše telefónne číslo"
                      autoComplete="tel"
                    />
                  </div>
                  <details className="cw-lead__optional">
                    <summary>Chcem pridať firmu, web alebo vzkaz</summary>
                    <div className="cw-lead__optional-body">
                      <div className="cw-lead__row">
                        <input
                          value={lead.company}
                          onChange={(event) =>
                            setLead({ ...lead, company: event.target.value })
                          }
                          placeholder="Názov firmy"
                          aria-label="Názov firmy"
                          autoComplete="organization"
                        />
                        <input
                          value={lead.web}
                          onChange={(event) =>
                            setLead({ ...lead, web: event.target.value })
                          }
                          placeholder="vasafirma.sk"
                          aria-label="Adresa vášho webu"
                          autoComplete="url"
                          inputMode="url"
                        />
                      </div>
                      <textarea
                        value={lead.note}
                        onChange={(event) =>
                          setLead({ ...lead, note: event.target.value })
                        }
                        placeholder="Čo by som mal ešte vedieť?"
                        aria-label="Vzkaz pre mňa"
                        rows={2}
                      />
                    </div>
                  </details>
                </div>
              </div>

              <div className="cw-summary">
                <span className="cw-summary__label">Čo som si zapísal</span>
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
            onClick={() =>
              setStep((value) => Math.min(STEPS.length - 1, value + 1))
            }
          >
            <span>Ďalej</span>
            <WidgetIcon name="arrow" />
          </button>
        </footer>
      ) : (
        /* The sticky slot carries the action that finishes the flow. Restart
           stays one tap away in the panel header, so it does not need to sit
           here pushing the submit button below the fold.

           Consent lives here rather than at the bottom of the scrolling form:
           it is the one box that has to be ticked before anything can be sent,
           so it belongs next to the button it gates, visible without scrolling.
           The whole row is the target, and it is a control the visitor can
           reach with one thumb. */
        <footer className="cw-calc-actions cw-calc-actions--final">
          {leadError ? (
            <p className="cw-lead__status" role="alert">
              {leadError}
            </p>
          ) : null}
          <label className="cw-consent" data-checked={lead.consent}>
            <input
              type="checkbox"
              checked={lead.consent}
              onChange={(event) =>
                setLead({ ...lead, consent: event.target.checked })
              }
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
                  <WidgetIcon name="send" /> Poslať zadanie
                </>
              )}
            </span>
          </button>
        </footer>
      )}
    </div>
  );
}
