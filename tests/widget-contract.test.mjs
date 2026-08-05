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

test("widget uses the website sliding segmented switch", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const polish = await read("src/widget-polish.css");

  assert.match(widget, /role="tablist"/);
  assert.match(widget, /role="tab"/);
  assert.match(widget, /className="cw-tabs__thumb"/);
  assert.match(widget, /aria-selected=\{mode === "assistant"\}/);
  assert.match(widget, /aria-selected=\{mode === "calculator"\}/);
  assert.match(widget, />Chatbot</);
  assert.match(widget, />Konfigurátor</);
  assert.doesNotMatch(widget, /ThumbDrag|setPointerCapture/);
  assert.doesNotMatch(widget, /resetSpinning|pulseReset|RESET_SPIN_MS/);
  assert.match(widget, /cw-online-dot/);
  assert.match(widget, />Online</);
  assert.doesNotMatch(widget, /Poradca a konfigurátor pre váš web/);
  assert.match(rule(polish, ".cw-widget .cw-tabs"), /border-radius:\s*999px/);
  assert.match(rule(polish, ".cw-widget .cw-tabs"), /background:\s*#10271c/);
  assert.match(rule(polish, ".cw-widget .cw-tabs__thumb"), /background:\s*#b3e9d0/);
  assert.match(
    rule(polish, '.cw-widget .cw-tabs[data-mode="calculator"] .cw-tabs__thumb'),
    /translateX\(100%\)/,
  );
});

test("vector logo is exactly the measured website mark", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(logo, /viewBox="0 0 112 112"/);
  assert.match(logo, /M92\.9 81\.1C97\.4 80\.8 100\.6 78\.6/);
  assert.match(logo, /M28\.6 65\.1V32\.9L53\.4 57\.5/);
  assert.match(logo, /className="bl__outer"/);
  assert.match(logo, /className="bl__inner"/);
  assert.match(logo, /stroke="currentColor"/);
  assert.equal((logo.match(/strokeWidth="7"/g) ?? []).length, 2);
  assert.doesNotMatch(logo, /<img|data:image|base64|fill="currentColor"|stroke="white"/);
  assert.match(rule(polish, ".cw-widget .cw-launcher"), /rgba\(11, 47, 32, 0\.76\)/);
  assert.match(rule(polish, ".cw-widget .cw-launcher"), /backdrop-filter:\s*blur\(18px\)/);
  assert.doesNotMatch(rule(polish, ".cw-widget .cw-launcher"), /background:\s*(?:var\(--cw-white\)|#fff(?:fff)?)/);
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

test("configurator keeps selected text visible with one flat green state", async () => {
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
  assert.match(polish, /One flat green family only/);
  assert.match(polish, /background:\s*#eaf2e8/);
  assert.match(polish, /background-image:\s*none/);
  assert.match(polish, /Strong text persistence/);
  assert.match(polish, /visibility:\s*visible/);
  assert.match(
    rule(polish, '.cw-widget .cw-calc-step[data-leaving="true"]'),
    /opacity:\s*1/,
  );
  assert.match(
    rule(polish, '.cw-widget .cw-calc-step[data-leaving="true"]'),
    /animation:\s*none/,
  );
  assert.doesNotMatch(polish, /linear-gradient[^;]*(?:selected|confirming)/i);
  assert.doesNotMatch(css, /--cw-tilt|rotateX|rotateY/);
});

test("configurator follows a compact Derat-style structure", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const polish = await read("src/widget-polish.css");

  assert.match(calculator, /className="cw-progress"/);
  assert.match(calculator, /className="cw-progress__back"/);
  assert.match(calculator, /className="cw-progress__dots"/);
  assert.match(calculator, /className="cw-calc-body"/);
  assert.match(calculator, /className="cw-calc-actions"/);
  assert.match(rule(polish, ".cw-widget .cw-progress"), /flex-basis:\s*58px/);
  assert.match(rule(polish, ".cw-widget .cw-calc-body"), /padding:\s*14px 13px 16px/);
  assert.match(rule(polish, ".cw-widget .cw-q"), /clamp\(21px, 5vw, 24px\)/);
  assert.match(rule(polish, ".cw-widget .cw-calc-actions"), /background:\s*rgba\(255, 255, 255, 0\.97\)/);
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
  assert.match(rule(polish, ".cw-widget .cw-rowcard"), /border-radius:\s*15px/);
  assert.match(rule(css, ".cw-submit"), /border-radius:\s*17px/);
  assert.match(rule(polish, ".cw-widget .cw-tabs"), /border-radius:\s*999px/);
});

test("palette stays within the website white forest lime identity", async () => {
  const css = `${await read("src/product-widget.css")}\n${await read("src/widget-polish.css")}`.toLowerCase();

  for (const token of [
    "#ffffff",
    "#fbfcf8",
    "#b9ed4d",
    "#d9ff78",
    "#b3e9d0",
    "#19834f",
    "#116b40",
    "#10271c",
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
  const polish = await read("src/widget-polish.css");
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
  assert.match(polish, /@media \(max-width: 430px\)/);
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
