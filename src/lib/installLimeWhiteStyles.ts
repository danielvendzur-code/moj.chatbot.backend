import limeWhiteCss from "../lime-white-widget-final.css?inline";
import whiteGreenLockCss from "../white-green-identity-lock.css?inline";
import approvedOptionOneCss from "../approved-option-one-widget-final.css?inline";
import professionalHarmonyCss from "../professional-harmony-widget-final.css?inline";

const STYLE_ID = "dv-assistant-lime-white-styles";

/**
 * Historical layers stay available for layout compatibility. The approved
 * logo and colour lock load first; the harmony layer is appended last to
 * control spacing, hierarchy, icons and launcher rendering.
 */
export function installLimeWhiteStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantTheme = "professional-white-green";
  style.textContent = `${limeWhiteCss}\n${whiteGreenLockCss}\n${approvedOptionOneCss}\n${professionalHarmonyCss}`;
  document.head.appendChild(style);
}
