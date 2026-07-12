import { ChameleonScene } from "./ChameleonScene";
import { SiteAssistantLauncher } from "./SiteAssistantLauncher";
import { SiteAssistantPanel } from "./SiteAssistantPanel";

export function SiteAssistant(): JSX.Element {
  return (
    <>
      <ChameleonScene />
      <SiteAssistantLauncher />
      <SiteAssistantPanel />
    </>
  );
}
