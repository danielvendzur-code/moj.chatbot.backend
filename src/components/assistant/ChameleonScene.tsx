import { useSiteAssistant } from "../../context/SiteAssistantContext";
import { ChameleonMascot } from "./ChameleonMascot";

export function ChameleonScene(): JSX.Element | null {
  const { sceneVisible, chameleonState } = useSiteAssistant();
  if (!sceneVisible) return null;

  return (
    <div className="chameleon-scene" data-state={chameleonState} aria-hidden="true">
      <span className="chameleon-scene__rail" />
      <ChameleonMascot state={chameleonState} mode="page" />
    </div>
  );
}
