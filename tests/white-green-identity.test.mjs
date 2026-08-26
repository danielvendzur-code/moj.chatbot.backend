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
  assert.doesNotMatch(
    main,
    /installLimeWhiteStyles|installProductRefinement|premiumTilt/,
  );
  assert.doesNotMatch(
    embed,
    /installLimeWhiteStyles|installProductRefinement|premiumTilt/,
  );
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
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior: auto !important/,
  );
});

test("launcher uses the supplied one-stroke mark and the solid hand-drawn redraw", async () => {
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const final = await read("src/solid-widget-final.css");
  const motion = await read("src/premium-motion-system.css");

  assert.equal((logo.match(/<path\b/g) ?? []).length, 1);
  assert.match(logo, /className="bl__stroke"/);
  assert.match(logo, /pathLength=\{1\}/);
  assert.match(logo, /stroke="currentColor"/);
  assert.match(logo, /strokeWidth="7\.25"/);
  assert.match(logo, /M24 71\.2L24\.003 32\.706/);
  assert.match(logo, /L96\.6 85\.5/);
  assert.match(final, /cw-logo-handdraw-hover 3\.25s/);
  assert.match(final, /cw-logo-handdraw-intro 2\.7s/);
  assert.match(
    motion,
    /\.cw-launcher\[aria-expanded="false"\] \.bl__stroke[\s\S]*cw-logo-one-line-cycle 6\.6s linear infinite/,
  );
  assert.match(motion, /@keyframes cw-logo-one-line-cycle/);
  assert.match(final, /background: #ffffff !important/);
  assert.match(final, /border-color: #0b2f20 !important/);
  assert.match(
    polish,
    /\.cw-widget \.cw-launcher,[\s\S]*color:\s*var\(--cw-green\)/,
  );
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
  assert.match(transition, /STEP_ENTER_MS = 560/);
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

  // The step asks for a name and one way to reach the visitor. The delivery
  // method picker and the consent tick box were two required interactions in
  // front of the send button, and neither of them told me anything the fields
  // do not.
  assert.doesNotMatch(calculator, /cw-contact-methods|contactMethod/);
  assert.doesNotMatch(calculator, /type="checkbox"/);
  assert.doesNotMatch(flow, /Kam vám môžem poslať/);
  assert.match(flow, /"Váš návrh je pripravený"/);
  assert.match(calculator, /className="cw-consent-note"/);
  assert.match(rule(css, ".cw-consent-note"), /font-size:\s*10\.5px/);

  // Nothing is free: what the visitor gets for the contact details is stated
  // above the fields, before the keyboard covers half the panel.
  assert.match(calculator, /REASSURANCES/);
  assert.match(calculator, /className="cw-reassure"/);
  assert.match(
    rule(css, ".cw-reassure li"),
    /border-radius:\s*var\(--cw-r-pill\)/,
  );

  assert.match(rule(css, ".cw-calc-actions"), /flex:\s*0 0 auto/);
  assert.match(calculator, /cw-lead__form/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /<details className="cw-summary">/);
  assert.match(calculator, /cw-submit cw-submit--approved/);
  assert.match(css, /\.cw-field :is\(input, textarea\)\[aria-invalid="true"\]/);
  assert.match(css, /\.cw-summary > summary/);

  // A 999 px radius on an open disclosure bows its sides into an egg. Open, it
  // is a card; closed, it stays the same capsule as every other one-line row.
  assert.match(
    rule(css, ".cw-lead__optional,\n.cw-summary"),
    /border-radius:\s*var\(--cw-r-pill\)/,
  );
  assert.match(
    rule(css, ".cw-lead__optional[open],\n.cw-summary[open]"),
    /border-radius:\s*var\(--cw-r-card\)/,
  );
});
