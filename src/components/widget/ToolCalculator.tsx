import { useEffect, useMemo, useState } from "react";
import {
  DETAIL_FLOWS,
  getSummary,
  getSummaryChips,
  GOALS,
} from "../../lib/assistantFlow";
import type { GoalId } from "../../types/assistant";
import { WidgetIcon } from "./WidgetIcon";

type ToolCalculatorProps = {
  resetToken: number;
  initialGoal: GoalId | null;
};

export function ToolCalculator({ resetToken, initialGoal }: ToolCalculatorProps): JSX.Element {
  const [step, setStep] = useState(initialGoal ? 1 : 0);
  const [goal, setGoal] = useState<GoalId | null>(initialGoal);
  const [details, setDetails] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setStep(initialGoal ? 1 : 0);
    setGoal(initialGoal);
    setDetails([]);
    setAcknowledged(false);
  }, [initialGoal, resetToken]);

  const flow = goal ? DETAIL_FLOWS[goal] : null;
  const selectedLabels = useMemo(
    () => flow?.options.filter((option) => details.includes(option.id)).map((option) => option.label) ?? [],
    [details, flow],
  );

  const restart = () => {
    setStep(0);
    setGoal(null);
    setDetails([]);
    setAcknowledged(false);
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else restart();
  };

  return (
    <div className="cw-calculator" data-testid="calculator-view">
      <header className="cw-calc-head">
        {step > 0 ? (
          <button type="button" onClick={goBack} aria-label="Späť">
            <WidgetIcon name="arrow" />
          </button>
        ) : <span className="cw-calc-head__spacer" />}
        <div>
          <b>Konfigurátor nástroja</b>
          <small>3 krátke kroky · bez odoslania</small>
        </div>
        <span className="cw-step-number">{step + 1}/3</span>
      </header>

      <div className="cw-progress" aria-label={`Krok ${step + 1} z 3`}>
        <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      <div className="cw-calc-body">
        {step === 0 ? (
          <section className="cw-calc-step" key="goals">
            <span className="cw-eyebrow">Vyskladajte si vlastný nástroj</span>
            <h3>Čo má váš nástroj robiť?</h3>
            <p>Vyberte hlavný výsledok. Technickú podobu vyriešime až potom.</p>
            <div className="cw-goal-list">
              {GOALS.map((option, index) => (
                <button
                  type="button"
                  data-testid={`goal-${option.id}`}
                  key={option.id}
                  onClick={() => {
                    setGoal(option.id as GoalId);
                    setDetails([]);
                    setStep(1);
                  }}
                >
                  <span className="cw-goal-number">{String(index + 1).padStart(2, "0")}</span>
                  <span><b>{option.label}</b><small>{option.description}</small></span>
                  <WidgetIcon name="arrow" />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 && flow ? (
          <section className="cw-calc-step" key={goal}>
            <span className="cw-eyebrow">{flow.eyebrow}</span>
            <h3>{flow.question}</h3>
            <p>Môžete označiť viac možností.</p>
            <div className="cw-detail-grid">
              {flow.options.map((option) => {
                const selected = details.includes(option.id);
                return (
                  <button
                    type="button"
                    data-testid={`detail-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => setDetails((current) => (
                      current.includes(option.id)
                        ? current.filter((item) => item !== option.id)
                        : [...current, option.id]
                    ))}
                  >
                    <span>{selected ? <WidgetIcon name="check" /> : null}</span>
                    <b>{option.label}</b>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 2 && goal ? (
          <section className="cw-calc-step cw-result" key="result">
            <span className="cw-eyebrow">Váš lokálny návrh</span>
            <h3>Toto je dobrý základ.</h3>
            <div className="cw-result-card">
              <span className="cw-result-card__icon"><WidgetIcon name="spark" /></span>
              <p>{getSummary(goal, selectedLabels)}</p>
              <div>{getSummaryChips(goal).map((chip) => <span key={chip}>{chip}</span>)}</div>
            </div>
            <p className="cw-local-note">Vizuálna ukážka — údaje sa neodosielajú ani neukladajú.</p>
            {acknowledged ? (
              <p className="cw-success" role="status"><WidgetIcon name="check" /> Návrh je pripravený iba v tejto ukážke.</p>
            ) : null}
          </section>
        ) : null}
      </div>

      <footer className="cw-calc-actions">
        {step === 0 ? (
          <p><WidgetIcon name="spark" /> Výber trvá menej než minútu.</p>
        ) : null}
        {step === 1 ? (
          <>
            <button type="button" className="cw-action-secondary" onClick={goBack}>Späť</button>
            <button
              type="button"
              className="cw-action-primary"
              data-testid="flow-next"
              disabled={details.length === 0}
              onClick={() => setStep(2)}
            >
              Zobraziť návrh <WidgetIcon name="arrow" />
            </button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" className="cw-action-secondary" onClick={restart}>Odznova</button>
            <button type="button" className="cw-action-primary" onClick={() => setAcknowledged(true)}>
              Pripraviť návrh <WidgetIcon name="arrow" />
            </button>
          </>
        ) : null}
      </footer>
    </div>
  );
}
