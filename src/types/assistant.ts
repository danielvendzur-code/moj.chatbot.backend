export type AssistantEntry =
  | "recommend"
  | "builder"
  | "calculator"
  | "inquiry"
  | "advisor"
  | "booking";

export type AssistantPreset = "calculator" | "inquiry" | "advisor" | "booking";

export type OpenSiteAssistantOptions = {
  entry: AssistantEntry;
  preset?: AssistantPreset;
};

export type ChameleonState =
  | "page-idle"
  | "noticed-fly"
  | "walking-to-launcher"
  | "arrived-at-launcher"
  | "prompting"
  | "opening-assistant"
  | "inside-assistant"
  | "watching"
  | "feeding"
  | "sleeping";

export type GoalId = AssistantPreset | "combined";

declare global {
  interface Window {
    openSiteAssistant: (options: OpenSiteAssistantOptions) => void;
    __siteAssistantDebug?: {
      getState: () => ChameleonState;
      triggerFly: () => void;
    };
  }
}
