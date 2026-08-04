import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the product stylesheet is the sole visual authority", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/product-widget.css");

  assert.match(main, /product-widget\.css/);
  assert.match(embed, /product-widget\.css/);
  assert.doesNotMatch(main, /installLimeWhiteStyles/);
  assert.doesNotMatch(embed, /installLimeWhiteStyles/);
  assert.doesNotMatch(main, /premiumTilt/);
  assert.doesNotMatch(embed, /premiumTilt/);
  assert.match(css, /MÔJ CHATBOT — unified product interface/);
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

test("launcher and brand mark never jump or bounce", async () => {
  const css = await read("src/product-widget.css");
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, /stroke="currentColor"/);
  assert.match(css, /\.cw-launcher:hover,[\s\S]*?transform:\s*none;/);
  assert.match(css, /\.cw-launcher:active[\s\S]*?transform:\s*none;/);
  assert.doesNotMatch(css, /@keyframes[^}]*bounce/i);
  assert.doesNotMatch(css, /\.bl[^}]*transform:/s);
});

test("header contains brand purpose rather than a fake availability state", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /AI nástroje pre váš web/);
  assert.doesNotMatch(widget, /Online|availability|Odpovedám hneď/);
});

test("backward step navigation releases the tall-step height lock", async () => {
  const transition = await read("src/hooks/useStepTransition.ts");
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

test("contact conversion surface keeps clear hierarchy", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /Ako sa vám mám ozvať\?/);
  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /cw-lead__form/);
  assert.match(calculator, /cw-summary/);
  assert.match(calculator, /cw-consent/);
  assert.match(calculator, /cw-submit cw-submit--approved/);
  assert.match(css, /NEZÁVÄZNÝ NÁVRH/);
  assert.match(css, /Stačí meno a kontakt/);
});
