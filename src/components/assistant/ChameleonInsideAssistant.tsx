import type { ChameleonState } from "../../types/assistant";
import { ChameleonMascot } from "./ChameleonMascot";
import { FlyParticle } from "./FlyParticle";

type ChameleonInsideAssistantProps = {
  state: ChameleonState;
  flyVisible: boolean;
};

export function ChameleonInsideAssistant({
  state,
  flyVisible,
}: ChameleonInsideAssistantProps): JSX.Element {
  return (
    <span className="assistant-header-mascot" aria-hidden="true">
      <FlyParticle visible={flyVisible} placement="panel" />
      <ChameleonMascot state={state} mode="panel" />
    </span>
  );
}
