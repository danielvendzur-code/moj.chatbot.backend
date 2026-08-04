import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("demo and embed load one foundation and one product stylesheet", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");

  assert.match(main, /preview\.css/);
  assert.match(main, /widget\.css/);
  assert.match(main, /product-widget\.css/);
  assert.equal((main.match(/import "\.\/.*\.css";/g) ?? []).length, 3);

  assert.doesNotMatch(embed, /preview\.css/);
  assert.match(embed, /widget\.css/);
  assert.match(embed, /product-widget\.css/);
  assert.equal((embed.match(/import "\.\/.*\.css";/g) ?? []).length, 2);

  for (const source of [main, embed]) {
    assert.doesNotMatch(source, /assistant-redesign|masterpiece-final|approved-submit/);
    assert.doesNotMatch(source, /installLimeWhiteStyles|installPremiumTilt/);
  }
  assert.doesNotMatch(autoAdvance, /import\s+["'].*\.css/);
});

test("widget shell uses accessible independent tabs without a draggable thumb", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /role="tablist"/);
  assert.match(widget, /role="tab"/);
  assert.match(widget, /aria-selected=\{mode === "assistant"\}/);
  assert.match(widget, /aria-selected=\{mode === "calculator"\}/);
  assert.match(widget, />Chatbot</);
  assert.match(widget, />Konfigurátor</);
  assert.doesNotMatch(widget, /cw-tabs__thumb|ThumbDrag|setPointerCapture/);
  assert.doesNotMatch(widget, /Online|Odpovedám hneď/);
  assert.match(widget, /AI nástroje pre váš web/);
});

test("exact vector logo remains green, crisp and motionless", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const css = await read("src/product-widget.css");

  assert.match(logo, /viewBox="0 0 112 112"/);
  assert.match(logo, /strokeWidth="4\.3"/);
  assert.doesNotMatch(logo, /<img|data:image|base64/);
  assert.match(rule(css, ".cw-launcher"), /color:\s*var\(--cw-lime\)/);
  assert.match(rule(css, ".cw-panel-head__mascot"), /color:\s*var\(--cw-lime\)/);
  assert.match(rule(css, ".cw-launcher:hover,"), /transform:\s*none/);
  assert.doesNotMatch(css, /\.bl[^}]*animation:/s);
});

test("panel and mode navigation use deliberate desktop proportions", async () => {
  const css = await read("src/product-widget.css");
  const panel = rule(css, ".cw-panel");
  const tabs = rule(css, ".cw-tabs");

  assert.match(panel, /width:\s*min\(424px,/);
  assert.match(panel, /height:\s*min\(704px,/);
  assert.match(panel, /border-radius:\s*25px/);
  assert.match(panel, /box-shadow:/);
  assert.match(tabs, /grid-template-columns:\s*repeat\(2,/);
  assert.match(tabs, /border-radius:\s*17px/);
  assert.match(css, /\.cw-tabs > button\[data-active="true"\]/);
  assert.match(css, /background:\s*var\(--cw-green\)/);
});

test("chat hierarchy and always-visible composer remain explicit", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/product-widget.css");

  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');
  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);

  assert.match(conversation, /Vyskladať riešenie/);
  assert.match(conversation, /disabled=\{!input\.trim\(\) \|\| typing/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /opacity:\s*1/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /visibility:\s*visible/);
  assert.match(
    rule(css, ".cw-inputbar > .cw-send:disabled"),
    /opacity:\s*1/,
  );
});

test("primary controls use the requested rounded geometry", async () => {
  const css = await read("src/product-widget.css");

  assert.match(rule(css, ".cw-chat-builder"), /border-radius:\s*20px/);
  assert.match(rule(css, ".cw-next"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-inputbar"), /border-radius:\s*19px/);
  assert.match(rule(css, ".cw-rowcard"), /border-radius:\s*18px/);
  assert.match(rule(css, ".cw-submit"), /border-radius:\s*18px/);
});

test("configurator selection is static, legible and auto-advances without CSS side effects", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.match(autoAdvance, /SINGLE_CHOICE_SELECTOR/);
  assert.match(autoAdvance, /next\.click\(\)/);
  assert.match(css, /data-confirming="true"/);
  assert.match(css, /\.cw-selection-indicator\[data-visible="true"\]/);
  assert.doesNotMatch(css, /--cw-tilt|rotateX|rotateY/);
});

test("palette stays within the website white forest lime identity", async () => {
  const css = (await read("src/product-widget.css")).toLowerCase();

  for (const token of [
    "#ffffff",
    "#fbfcf8",
    "#b9ed4d",
    "#d9ff78",
    "#19834f",
    "#116b40",
    "#0b2f20",
    "#132019",
  ]) {
    assert.ok(css.includes(token), `Missing product token ${token}`);
  }

  for (const retired of [
    "#ffc79d",
    "#e58a5b",
    "#4db6ac",
    "#3478f6",
    "#1f55c9",
  ]) {
    assert.ok(!css.includes(retired), `Retired accent ${retired} returned`);
  }
});

test("mobile and reduced-motion fallbacks are first-class", async () => {
  const css = await read("src/product-widget.css");

  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /width:\s*100dvw/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation-duration:\s*1ms/);
  assert.match(css, /data-composing="true"/);
});

test("icons remain one custom rounded line family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  for (const icon of [
    "calculator",
    "chat",
    "phone",
    "mail",
    "spark",
    "reset",
    "send",
  ]) {
    assert.ok(icons.includes(`"${icon}"`), `Missing icon ${icon}`);
  }
});

test("configurator remains a short five-step conversion flow", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const match = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(match, "STEPS definition missing");
  const steps = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  assert.deepEqual(steps, [
    "interest",
    "industry",
    "features",
    "timeline",
    "contact",
  ]);
});
