import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("the visual system is static, ordered and free of injected overrides", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(main, /product-widget\.css/);
  assert.match(main, /widget-polish\.css/);
  assert.match(embed, /product-widget\.css/);
  assert.match(embed, /widget-polish\.css/);
  assert.doesNotMatch(main, /installLimeWhiteStyles|installProductRefinement|premiumTilt/);
  assert.doesNotMatch(embed, /installLimeWhiteStyles|installProductRefinement|premiumTilt/);
  assert.match(css, /MÔJ CHATBOT — competition-audited product interface/);
  assert.match(polish, /Final interaction polish/);
  assert.match(polish, /\.cw-widget \.cw-chip__label/);
  assert.match(polish, /\.cw-chip\[data-sending="true"\]/);
  assert.doesNotMatch(css, /html:root body \.cw-widget|\[class\]\[class\]/);

  const importantLines = css
    .split("\n")
    .filter((line) => line.includes("!important"));
  assert.deepEqual(importantLines, [
    "    scroll-behavior: auto !important;",
    "    animation-duration: 1ms !important;",
    "    animation-iteration-count: 1 !important;",
    "    transition-duration: 1ms !important;",
  ]);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior: auto !important/);
});

test("launcher uses the supplied one-stroke mark and a deliberate hover redraw", async () => {
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const final = await read("src/launch-ready-final.css");

  assert.equal((logo.match(/<path\b/g) ?? []).length, 1);
  assert.match(logo, /className="bl__stroke"/);
  assert.match(logo, /pathLength=\{1\}/);
  assert.match(logo, /stroke="currentColor"/);
  assert.match(logo, /strokeWidth="5\.5"/);
  assert.match(logo, /M24 71\.2L24\.003 32\.706/);
  assert.match(logo, /L96\.6 85\.5/);
  assert.match(final, /cw-launch-one-stroke 2\.75s/);
  assert.match(final, /stroke-dashoffset:\s*1/);
  assert.match(polish, /\.cw-widget \.cw-launcher,[\s\S]*color:\s*var\(--cw-green\)/);
  assert.match(css, /\.cw-launcher:hover,[\s\S]*?transform:\s*none;/);
  assert.match(css, /\.cw-launcher:active[\s\S]*?transform:\s*none;/);
  assert.doesNotMatch(css, /@keyframes[^}]*bounce/i);
});

test("header is the brand plus a live availability state, nothing else", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /className="cw-panel-head__online"/);
  assert.match(widget, />\s*Online\s*</);
  assert.doesNotMatch(widget, /Poradca a konfigurátor/);
});

test("backward step navigation releases the tall-step height lock quickly", async () => {
  const transition = await read("src/hooks/useStepTransition.ts");
  assert.match(transition, /STEP_ENTER_MS = 220/);
  assert.match(transition, /nextDirection === "forward"/);
  assert.match(transition, /nextDirection === "backward"/);
  assert.match(transition, /container\.style\.minHeight = ""/);
  assert.match(transition, /direction === "backward"/);
});

test("mobile iframe freezes and restores the parent page on iOS", async () => {
  const embed = await read("public/embed.js");
  assert.match(embed, /document\.body\.style\.position = "fixed"/);
  assert.match(embed, /document\.body\.style\.top = -savedScrollY \+ "px"/);
  assert.match(embed, /document\.body\.style\.left = -savedScrollX \+ "px"/);
  assert.match(embed, /document\.documentElement\.style\.touchAction = "none"/);
  assert.match(embed, /document\.body\.style\.overscrollBehavior = "none"/);
  assert.match(embed, /document\.body\.style\.position = savedBodyPosition/);
  assert.match(embed, /window\.scrollTo\(savedScrollX, savedScrollY\)/);
});

test("contact step fits without scrolling and keeps sending obvious", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const css = await read("src/product-widget.css");

  assert.doesNotMatch(calculator, /cw-lead__intro/);
  assert.doesNotMatch(calculator, /Nezáväzný dopyt/);
  assert.doesNotMatch(calculator, /Stačí meno a jeden kontakt/);
  assert.doesNotMatch(flow, /Stačí meno a jeden kontakt/);

  assert.match(rule(css, ".cw-contact-methods"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-contact-method"), /min-height:\s*44px/);
  assert.match(rule(css, ".cw-consent"), /min-height:\s*26px/);
  assert.match(rule(css, ".cw-consent"), /border:\s*0/);
  assert.match(rule(css, ".cw-calc-actions"), /flex:\s*0 0 auto/);

  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /cw-lead__form/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /<details className="cw-summary">/);
  assert.match(calculator, /cw-consent/);
  assert.match(calculator, /cw-submit cw-submit--approved/);
  assert.match(css, /\.cw-field :is\(input, textarea\)\[aria-invalid="true"\]/);
  assert.match(css, /\.cw-summary > summary/);
});
