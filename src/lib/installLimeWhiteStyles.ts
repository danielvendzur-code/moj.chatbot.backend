import limeWhiteCss from "../lime-white-widget-final.css?inline";
import whiteGreenLockCss from "../white-green-identity-lock.css?inline";
import approvedOptionOneCss from "../approved-option-one-widget-final.css?inline";

const STYLE_ID = "dv-assistant-lime-white-styles";

/**
 * Historical layers stay available for layout compatibility. The approved
 * option 1 layer is appended last and is therefore the final visual authority.
 */
export function installLimeWhiteStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantTheme = "approved-option-one";
  style.textContent = `${limeWhiteCss}\n${whiteGreenLockCss}\n${approvedOptionOneCss}`;
  document.head.appendChild(style);
}
