import { useEffect, useMemo, useState } from "react";
import { useSiteAssistant } from "../../context/SiteAssistantContext";
import {
  DETAIL_FLOWS,
  getSummary,
  getSummaryChips,
  GOALS,
} from "../../lib/assistantFlow";
import type { AssistantPreset, GoalId } from "../../types/assistant";

const isPreset = (value: string): value is AssistantPreset =>
  ["calculator", "inquiry", "advisor", "booking"].includes(value);

export function AssistantFlow(): JSX.Element {
  const { request, requestId, notifyActivity } = useSiteAssistant();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const directPreset = request.preset ?? (isPreset(request.entry) ? request.entry : undefined);
    setGoal(directPreset ?? null);
    setStep(directPreset ? 1 : 0);
    setDetails([]);
    setAcknowledged(false);
  }, [request, requestId]);

  const flow = goal ? DETAIL_FLOWS[goal] : null;
  const selectedLabels = useMemo(
    () => flow?.options.filter((option) => details.includes(option.id)).map((option) => option.label) ?? [],
    [details, flow],
  );

  const chooseGoal = (nextGoal: GoalId) => {
    notifyActivity();
    setGoal(nextGoal);
    setDetails([]);
    setStep(1);
  };

  const toggleDetail = (id: string) => {
    notifyActivity();
    setDetails((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const restart = () => {
    notifyActivity();
    setGoal(null);
    setDetails([]);
    setStep(0);
    setAcknowledged(false);
  };

  const goBack = () => {
    notifyActivity();
    if (step === 2) setStep(1);
    else restart();
  };

  return (
    <div className="assistant-flow" onScroll={notifyActivity}>
      <div className="assistant-progress" aria-label={`Krok ${step + 1} z 3`}>
        <span className="assistant-progress__meta">{String(step + 1).padStart(2, "0")} / 03</span>
        <span className="assistant-progress__track" aria-hidden="true">
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </span>
      </div>

      <section className="assistant-step" key={`${requestId}-${step}`}>
        {step === 0 ? (
          <>
            <p className="assistant-step__eyebrow">Vyskladajte si vlastný nástroj</p>
            <h3>Čo má váš nástroj robiť?</h3>
            <p className="assistant-step__intro">
              Vyberte hlavný výsledok. O technickú podobu sa zatiaľ nemusíte starať.
            </p>
            <div className="goal-options">
              {GOALS.map((option, index) => (
                <button
                  type="button"
                  className="goal-option"
                  data-testid={`goal-${option.id}`}
                  key={option.id}
                  onClick={() => chooseGoal(option.id as GoalId)}
                >
                  <span className="goal-option__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="goal-option__copy">
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                  <span className="goal-option__arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 && flow && goal ? (
          <>
            <p className="assistant-step__eyebrow">{flow.eyebrow}</p>
            <h3>{flow.question}</h3>
            <p className="assistant-step__intro">Môžete označiť viac možností.</p>
            <div className="detail-options">
              {flow.options.map((option) => {
                const selected = details.includes(option.id);
                return (
                  <button
                    type="button"
                    className="detail-option"
                    data-testid={`detail-${option.id}`}
                    data-selected={selected}
                    aria-pressed={selected}
                    key={option.id}
                    onClick={() => toggleDetail(option.id)}
                  >
                    <span className="detail-option__check" aria-hidden="true">{selected ? "✓" : ""}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="assistant-flow__actions">
              <button className="text-button" data-testid="flow-back" type="button" onClick={goBack}>Späť</button>
              <button
                className="primary-button"
                data-testid="flow-next"
                type="button"
                disabled={details.length === 0}
                onClick={() => {
                  notifyActivity();
                  setStep(2);
                }}
              >
                Zobraziť návrh <span aria-hidden="true">→</span>
              </button>
            </div>
          </>
        ) : null}

        {step === 2 && goal ? (
          <>
            <p className="assistant-step__eyebrow">Lokálny návrh</p>
            <h3>Máme dobrý základ.</h3>
            <div className="assistant-summary">
              <span className="assistant-summary__mark" aria-hidden="true">↳</span>
              <p>{getSummary(goal, selectedLabels)}</p>
              <div className="assistant-summary__chips">
                {getSummaryChips(goal).map((chip) => <span key={chip}>{chip}</span>)}
              </div>
            </div>
            <p className="assistant-disclaimer">
              Toto je vizuálna ukážka. Údaje sa neodosielajú ani neukladajú.
            </p>
            {acknowledged ? (
              <p className="assistant-local-status" role="status">
                Návrh zostáva iba v tomto prehliadači. V ďalšej fáze sa môže napojiť formulár.
              </p>
            ) : null}
            <div className="assistant-flow__actions assistant-flow__actions--stacked">
              <button className="primary-button primary-button--wide" data-testid="flow-finish" type="button" onClick={() => setAcknowledged(true)}>
                Pripraviť návrh <span aria-hidden="true">↗</span>
              </button>
              <div className="assistant-flow__secondary-actions">
                <button className="text-button" data-testid="flow-back" type="button" onClick={goBack}>Späť</button>
                <button className="text-button" data-testid="flow-restart" type="button" onClick={restart}>Začať odznova</button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
