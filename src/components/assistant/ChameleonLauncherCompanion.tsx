import type { ChameleonState } from "../../types/assistant";
import { ChameleonMascot } from "./ChameleonMascot";
import { FlyParticle } from "./FlyParticle";

type ChameleonLauncherCompanionProps = {
  state: ChameleonState;
  flyVisible: boolean;
};

export function ChameleonLauncherCompanion({
  state,
  flyVisible,
}: ChameleonLauncherCompanionProps): JSX.Element {
  return (
    <span className="launcher-companion" aria-hidden="true">
      <FlyParticle visible={flyVisible} placement="launcher" />
      <ChameleonMascot state={state} mode="launcher" />
    </span>
  );
}
