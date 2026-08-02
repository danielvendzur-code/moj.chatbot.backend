import limeWhiteCss from "../lime-white-widget-final.css?inline";
import whiteGreenLockCss from "../white-green-identity-lock.css?inline";

const STYLE_ID = "dv-assistant-lime-white-styles";

/**
 * Historical widget styles remain available for layout compatibility, but the
 * strict identity lock is appended in the same final style element. Its higher
 * scoped specificity removes every surviving peach/orange state without
 * changing the widget's dimensions or behavior.
 */
export function installLimeWhiteStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantTheme = "white-forest-lime";
  style.textContent = `${limeWhiteCss}\n${whiteGreenLockCss}`;
  document.head.appendChild(style);
}
