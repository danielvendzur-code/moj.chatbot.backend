import productRefinementCss from "../product-refinement.css?inline";

const STYLE_ID = "dv-assistant-product-refinement";

export function installProductRefinement(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.dvAssistantRefinement = "proven-widget-20260804-v1";
  style.textContent = productRefinementCss;
  document.head.appendChild(style);
}
