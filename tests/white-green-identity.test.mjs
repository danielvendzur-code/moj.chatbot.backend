import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the runtime stays static and free of injected visual overrides", async () => {
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
  assert.match(css, /competition-audited product interface/);
  assert.match(polish, /final visual authority/);

  const importantLines = css
    .split("\n")
    .filter((line) => line.includes("!important"));
  assert.deepEqual(importantLines, [
    "    scroll-behavior: auto !important;",
    "    animation-duration: 1ms !important;",
    "    animation-iteration-count: 1 !important;",
    "    transition-duration: 1ms !important;",
  ]);
});

test("the new mark is motionless and has no opaque icon tile", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const polish = await read("src/widget-polish.css");
  const css = await read("src/product-widget.css");

  assert.match(logo, /bl__frame/);
  assert.match(logo, /bl__monogram/);
  assert.match(logo, /stroke="currentColor"/);
  assert.match(logo, /L50\.5 55L36\.5 47/);
  assert.doesNotMatch(logo, /fill="currentColor"|stroke="white"|bl__outer|bl__inner/);
  assert.match(polish, /\.cw-widget \.cw-panel-head__mascot[\s\S]*background:\s*transparent/);
  assert.match(polish, /\.cw-widget \.cw-launcher[\s\S]*rgba\(236, 248, 241, 0\.68\)/);
  assert.match(css, /\.cw-launcher:hover,[\s\S]*?transform:\s*none;/);
  assert.doesNotMatch(css, /@keyframes[^}]*bounce/i);
});

test("header status contains only Online", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /cw-online-dot/);
  assert.match(widget, />Online</);
  assert.doesNotMatch(widget, /Odpovedám hneď|Poradca a konfigurátor|availability/i);
});

test("back navigation releases the outgoing height immediately", async () => {
  const transition = await read("src/hooks/useStepTransition.ts");
  assert.match(transition, /nextDirection === "forward"/);
  assert.match(transition, /nextDirection === "backward"/);
  assert.match(transition, /container\.style\.minHeight = ""/);
  assert.match(transition, /direction === "backward"/);
});

test("mobile embed locks and restores the parent page", async () => {
  const embed = await read("public/embed.js");
  assert.match(embed, /document\.body\.style\.position = "fixed"/);
  assert.match(embed, /document\.body\.style\.top = -savedScrollY \+ "px"/);
  assert.match(embed, /document\.documentElement\.style\.touchAction = "none"/);
  assert.match(embed, /document\.body\.style\.position = savedBodyPosition/);
  assert.match(embed, /window\.scrollTo\(savedScrollX, savedScrollY\)/);
});

test("contact conversion keeps visible labels and one-contact validation", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /Ako sa vám mám ozvať\?/);
  assert.match(calculator, /Nezáväzný dopyt/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /aria-invalid=\{nameInvalid\}/);
  assert.match(calculator, /aria-invalid=\{emailInvalid\}/);
  assert.match(calculator, /aria-invalid=\{phoneInvalid\}/);
  assert.match(calculator, /cw-consent/);
  assert.match(css, /\.cw-field :is\(input, textarea\)\[aria-invalid="true"\]/);
});
