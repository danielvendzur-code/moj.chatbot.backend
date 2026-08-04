import limeWhiteCss from "../lime-white-widget-final.css?inline";
import whiteGreenLockCss from "../white-green-identity-lock.css?inline";
import approvedOptionOneCss from "../approved-option-one-widget-final.css?inline";
import professionalHarmonyCss from "../professional-harmony-widget-final.css?inline";
import siteGreenBrandCss from "../site-green-brand-final.css?inline";
import siteGreenChatCss from "../site-green-chat-final.css?inline";
import siteGreenConfigCss from "../site-green-config-final.css?inline";
import siteGreenMobileCss from "../site-green-mobile-final.css?inline";
import webAlignedPolishCss from "../web-aligned-polish-final.css?inline";

const STYLE_ID = "dv-assistant-lime-white-styles";

/** Historical layers remain for layout compatibility. The site-green sheets
 * establish the finished identity and the web-aligned sheet is the final
 * authority for launcher, shell and primary-action polish. */
export function installLimeWhiteStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantTheme = "site-white-forest-lime";
  style.textContent = `${limeWhiteCss}\n${whiteGreenLockCss}\n${approvedOptionOneCss}\n${professionalHarmonyCss}\n${siteGreenBrandCss}\n${siteGreenChatCss}\n${siteGreenConfigCss}\n${siteGreenMobileCss}\n${webAlignedPolishCss}`;
  document.head.appendChild(style);
}
