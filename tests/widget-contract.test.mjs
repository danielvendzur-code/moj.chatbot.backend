import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("demo and embed load the ordered static widget styles", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");

  assert.match(main, /preview\.css/);
  assert.match(main, /widget\.css/);
  assert.match(main, /product-widget\.css/);
  assert.match(main, /widget-polish\.css/);
  assert.equal((main.match(/import "\.\/.*\.css";/g) ?? []).length, 4);

  assert.doesNotMatch(embed, /preview\.css/);
  assert.match(embed, /widget\.css/);
  assert.match(embed, /product-widget\.css/);
  assert.match(embed, /widget-polish\.css/);
  assert.equal((embed.match(/import "\.\/.*\.css";/g) ?? []).length, 3);

  for (const source of [main, embed]) {
    assert.doesNotMatch(source, /assistant-redesign|masterpiece-final|approved-submit/);
    assert.doesNotMatch(
      source,
      /installLimeWhiteStyles|installPremiumTilt|installProductRefinement/,
    );
  }
  assert.doesNotMatch(autoAdvance, /import\s+["'].*\.css/);
});

test("widget shell uses accessible rounded mode chips without drag logic", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const polish = await read("src/widget-polish.css");

  assert.match(widget, /role="tablist"/);
  assert.match(widget, /role="tab"/);
  assert.match(widget, /aria-selected=\{mode === "assistant"\}/);
  assert.match(widget, /aria-selected=\{mode === "calculator"\}/);
  assert.match(widget, />Chatbot</);
  assert.match(widget, />Konfigurátor</);
  assert.doesNotMatch(widget, /cw-tabs__thumb|ThumbDrag|setPointerCapture/);
  assert.doesNotMatch(widget, /resetSpinning|pulseReset|RESET_SPIN_MS/);
  assert.match(widget, /Poradca a konfigurátor pre váš web/);
  assert.match(rule(polish, ".cw-widget .cw-tabs"), /border-radius:\s*18px/);
  assert.match(rule(polish, ".cw-widget .cw-tabs > button"), /border-radius:\s*14px/);
  assert.match(
    rule(polish, '.cw-widget .cw-tabs > button[data-active="true"]'),
    /background:\s*var\(--cw-green\)/,
  );
});

test("filled vector logo remains green, crisp and motionless", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(logo, /viewBox="0 0 112 112"/);
  assert.match(logo, /className="bl__bubble"/);
  assert.match(logo, /fill="currentColor"/);
  assert.match(logo, /className="bl__monogram"/);
  assert.match(logo, /stroke="white"/);
  assert.match(logo, /strokeWidth="8"/);
  assert.doesNotMatch(logo, /<img|data:image|base64|bl__optical-weight/);
  assert.match(
    rule(polish, ".cw-widget .cw-launcher,\n.cw-widget .cw-panel-head__mascot,\n.cw-widget .cw-avatar"),
    /color:\s*var\(--cw-green\)/,
  );
  assert.match(
    css,
    /\.cw-launcher:hover,[\s\S]*?\.cw-launcher:focus-visible\s*\{[\s\S]*?transform:\s*none;/,
  );
  assert.doesNotMatch(css, /\.bl[^}]*animation:/s);
});

test("panel proportions and hierarchy are deliberate", async () => {
  const css = await read("src/product-widget.css");
  const panel = rule(css, ".cw-panel");

  assert.match(panel, /width:\s*min\(432px,/);
  assert.match(panel, /height:\s*min\(724px,/);
  assert.match(panel, /border-radius:\s*26px/);
  assert.match(panel, /box-shadow:/);
  assert.match(rule(css, ".cw-panel-head__title h2"), /font-size:\s*18px/);
  assert.match(rule(css, ".cw-panel-head__title p"), /font-size:\s*12px/);
});

test("chat hierarchy is readable and selected chip text stays present", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');
  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);

  assert.match(conversation, /4 otázky · približne 1 minúta/);
  assert.match(conversation, /QUICK_REPLY_HOLD_MS = 360/);
  assert.match(conversation, /activeQuickReply !== null/);
  assert.match(conversation, /className="cw-chip__label"/);
  assert.match(conversation, /aria-pressed=\{sending\}/);
  assert.match(conversation, /data-started=\{conversationStarted/);
  assert.match(conversation, /Radšej priamo\?/);
  assert.match(conversation, /disabled=\{!input\.trim\(\) \|\| typing/);
  assert.doesNotMatch(conversation, /flightOrigin|bubble\.animate|translate3d|getBoundingClientRect/);
  assert.match(rule(css, ".cw-message-wrap p"), /font-size:\s*14px/);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /font-size:\s*12\.5px/);
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /visibility:\s*visible/);
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /opacity:\s*1/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /opacity:\s*1/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /visibility:\s*visible/);
  assert.match(rule(css, ".cw-inputbar > .cw-send:disabled"), /opacity:\s*1/);
});

test("direct contact is a quiet utility row rather than three mini cards", async () => {
  const css = await read("src/product-widget.css");
  const actions = rule(css, ".cw-direct-actions");
  const links = rule(css, ".cw-direct-actions__grid a");

  assert.match(actions, /display:\s*flex/);
  assert.match(links, /background:\s*transparent/);
  assert.doesNotMatch(links, /border:/);
  assert.match(links, /font-size:\s*11\.5px/);
});

test("configurator keeps the selected label readable before auto-advance", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.match(autoAdvance, /CONFIRM_MS = 520/);
  assert.match(autoAdvance, /next\.click\(\)/);
  assert.match(css, /data-confirming="true"/);
  assert.match(css, /\.cw-selection-indicator\[data-visible="true"\]/);
  assert.match(polish, /Keep the selected answer readable/);
  assert.match(polish, /visibility:\s*visible/);
  assert.doesNotMatch(css, /--cw-tilt|rotateX|rotateY/);
  assert.match(
    css,
    /\.cw-rowcard\[data-selected="true"\],[\s\S]*?background:\s*var\(--cw-lime-soft\)/,
  );
});

test("progress and contact step expose clear state and labels", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /cw-progress__dots/);
  assert.match(calculator, /Krok \$\{visibleStep \+ 1\} z \$\{STEPS\.length\}/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /aria-invalid=\{nameInvalid\}/);
  assert.match(calculator, /aria-invalid=\{emailInvalid\}/);
  assert.match(calculator, /aria-invalid=\{phoneInvalid\}/);
  assert.match(calculator, /<details className="cw-summary">/);
  assert.match(calculator, /Poslať nezáväzný dopyt/);
  assert.doesNotMatch(calculator, /label: "Osobne"/);
  assert.match(rule(css, ".cw-progress__dots"), /grid-template-columns:\s*repeat\(5,/);
});

test("primary controls keep intentional, differentiated geometry", async () => {
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(rule(css, ".cw-chat-builder"), /border-radius:\s*18px/);
  assert.match(rule(css, ".cw-next"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-inputbar"), /border-radius:\s*19px/);
  assert.match(rule(css, ".cw-rowcard"), /border-radius:\s*17px/);
  assert.match(rule(css, ".cw-submit"), /border-radius:\s*17px/);
  assert.match(rule(polish, ".cw-widget .cw-tabs"), /border-radius:\s*18px/);
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

test("mobile, keyboard and reduced-motion fallbacks are first-class", async () => {
  const css = await read("src/product-widget.css");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /width:\s*100dvw/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation-duration:\s*1ms/);
  assert.match(css, /data-composing="true"/);
  assert.match(css, /contain:\s*paint/);
  assert.match(conversation, /canAutoFocus/);
  assert.match(conversation, /pointer: fine/);
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
