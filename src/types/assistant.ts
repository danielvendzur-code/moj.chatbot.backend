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

export type InterestId = "chatbot" | "calcbot" | "booking" | "custom";

declare global {
  interface Window {
    openSiteAssistant: (options: OpenSiteAssistantOptions) => void;
  }
}
