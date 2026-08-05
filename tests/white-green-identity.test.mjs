import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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
  assert.match(polish, /Website-matched finishing layer/);
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

test("launcher uses the exact website mark on translucent dark glass", async () => {
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, /className="bl__outer"/);
  assert.match(logo, /className="bl__inner"/);
  assert.match(logo, /stroke="currentColor"/);
  assert.equal((logo.match(/strokeWidth="7"/g) ?? []).length, 2);
  assert.match(logo, /L33\.5 104\.5L57\.5 81\.1/);
  assert.doesNotMatch(logo, /bl__bubble|bl__monogram|fill="currentColor"|stroke="white"/);
  assert.match(polish, /\.cw-widget \.cw-launcher\s*\{[\s\S]*color:\s*var\(--cw-lime\)/);
  assert.match(polish, /background:\s*rgba\(11, 47, 32, 0\.76\)/);
  assert.match(polish, /backdrop-filter:\s*blur\(18px\)/);
  assert.match(css, /\.cw-launcher:hover,[\s\S]*?transform:\s*none;/);
  assert.match(css, /\.cw-launcher:active[\s\S]*?transform:\s*none;/);
  assert.doesNotMatch(css, /@keyframes[^}]*bounce/i);
  assert.doesNotMatch(polish, /\.bl[^}]*transform:/s);
});

test("header status contains only Online", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /cw-online-dot/);
  assert.match(widget, />Online</);
  assert.doesNotMatch(widget, /Poradca a konfigurátor pre váš web|Odpovedám hneď|availability/);
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

test("contact conversion surface keeps clear hierarchy and visible labels", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /Ako sa vám mám ozvať\?/);
  assert.match(calculator, /Nezáväzný dopyt/);
  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /cw-lead__form/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /<details className="cw-summary">/);
  assert.match(calculator, /cw-consent/);
  assert.match(calculator, /cw-submit cw-submit--approved/);
  assert.match(css, /\.cw-field :is\(input, textarea\)\[aria-invalid="true"\]/);
  assert.match(css, /\.cw-summary > summary/);
});
