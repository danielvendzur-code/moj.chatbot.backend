import limeWhiteCss from "../lime-white-widget-final.css?inline";

const STYLE_ID = "dv-assistant-lime-white-styles";

/**
 * The historical stylesheet order is a protected production contract.
 * Install the approved identity as one final scoped style element instead of
 * disturbing that order. This keeps the direct widget self-contained and
 * guarantees that the brand layer follows widget.css in document order.
 */
export function installLimeWhiteStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantTheme = "white-forest-lime";
  style.textContent = limeWhiteCss;
  document.head.appendChild(style);
}
