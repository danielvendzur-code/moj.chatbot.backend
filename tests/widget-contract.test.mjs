import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("demo and embed load only the ordered static widget styles", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");

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
    assert.doesNotMatch(
      source,
      /installLimeWhiteStyles|installPremiumTilt|installProductRefinement|masterpiece-final/,
    );
  }
});

test("new logo is a clean outline mark without a tile", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const polish = await read("src/widget-polish.css");

  assert.match(logo, /viewBox="0 0 64 64"/);
  assert.match(logo, /M15 12\.5H49C53\.7 12\.5/);
  assert.match(logo, /M18 36V23L32 34\.5L46 23V36/);
  assert.match(logo, /className="bl__frame"/);
  assert.match(logo, /className="bl__monogram"/);
  assert.equal((logo.match(/strokeWidth="4\.4"/g) ?? []).length, 2);
  assert.doesNotMatch(logo, /fill="currentColor"|stroke="white"|<img|base64/);
  assert.match(rule(polish, ".cw-widget .cw-panel-head__mascot"), /background:\s*transparent/);
  assert.match(rule(polish, ".cw-widget .cw-panel-head__mascot"), /border:\s*0/);
});

test("launcher is translucent and shaped like a chat surface", async () => {
  const polish = await read("src/widget-polish.css");
  const launcher = rule(polish, ".cw-widget .cw-launcher");

  assert.match(launcher, /width:\s*66px/);
  assert.match(launcher, /border-radius:\s*23px 23px 8px 23px/);
  assert.match(launcher, /rgba\(236, 248, 241, 0\.68\)/);
  assert.match(launcher, /backdrop-filter:\s*blur\(18px\)/);
  assert.doesNotMatch(launcher, /background:\s*(?:#fff|#ffffff|var\(--cw-white\))/);
});

test("header contains only the honest Online state", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");

  assert.match(widget, /cw-online-dot/);
  assert.match(widget, />Online</);
  assert.doesNotMatch(widget, /Odpovedám hneď|Poradca a konfigurátor|availability/i);
});

test("mode switch keeps the website idea without dominating the widget", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const polish = await read("src/widget-polish.css");
  const tabs = rule(polish, ".cw-widget .cw-tabs");
  const thumb = rule(polish, ".cw-widget .cw-tabs__thumb");

  assert.match(widget, /className="cw-tabs__thumb"/);
  assert.match(widget, />Chatbot</);
  assert.match(widget, />Konfigurátor</);
  assert.match(tabs, /width:\s*min\(286px,/);
  assert.match(tabs, /min-height:\s*44px/);
  assert.match(tabs, /flex:\s*0 0 44px/);
  assert.match(tabs, /background:\s*#10271c/);
  assert.match(thumb, /background:\s*var\(--cw-polish-mint\)/);
  assert.match(
    rule(polish, '.cw-widget .cw-tabs[data-mode="calculator"] .cw-tabs__thumb'),
    /translateX\(100%\)/,
  );
});

test("quick reply text remains present while the click is confirmed", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const polish = await read("src/widget-polish.css");

  assert.match(conversation, /className="cw-chip__label"/);
  assert.match(conversation, /activeQuickReply !== null/);
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /opacity:\s*1/);
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /visibility:\s*visible/);
  assert.match(polish, /cw-chip\[data-sending="true"\]/);
});

test("selected configurator text stays visible long enough to be understood", async () => {
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");
  const polish = await read("src/widget-polish.css");

  assert.match(autoAdvance, /CONFIRM_MS = 650/);
  assert.match(autoAdvance, /next\.click\(\)/);
  assert.match(
    rule(polish, '.cw-widget .cw-calc-step[data-leaving="true"]'),
    /opacity:\s*1/,
  );
  assert.match(
    rule(polish, '.cw-widget .cw-calc-step[data-leaving="true"]'),
    /animation:\s*none/,
  );
  assert.match(polish, /visibility:\s*visible/);
  assert.match(polish, /background:\s*var\(--cw-polish-mint-soft\)/);
  assert.doesNotMatch(polish, /linear-gradient[^;]*(selected|confirming)/i);
});

test("progress presents four questions instead of five conflicting bars", async () => {
  const polish = await read("src/widget-polish.css");

  assert.match(
    rule(polish, ".cw-widget .cw-progress__dots"),
    /grid-template-columns:\s*repeat\(4,/,
  );
  assert.match(
    rule(polish, ".cw-widget .cw-progress__dots i:last-child"),
    /display:\s*none/,
  );
  assert.match(rule(polish, ".cw-widget .cw-progress"), /flex:\s*0 0 49px/);
  assert.match(rule(polish, ".cw-widget .cw-progress__dots i"), /height:\s*4px/);
});

test("first-step cards are compact and readable", async () => {
  const polish = await read("src/widget-polish.css");
  const card = rule(polish, ".cw-widget .cw-rowcard");

  assert.match(card, /min-height:\s*72px/);
  assert.match(card, /padding:\s*9px 12px/);
  assert.match(card, /border-radius:\s*16px/);
  assert.match(rule(polish, ".cw-widget .cw-rowcard__body b"), /font-size:\s*14\.5px/);
  assert.match(rule(polish, ".cw-widget .cw-rowcard__body small"), /font-size:\s*11\.8px/);
});

test("disabled continuation is visibly disabled, not a broken green CTA", async () => {
  const polish = await read("src/widget-polish.css");
  const disabled = rule(polish, ".cw-widget .cw-next:disabled");

  assert.match(disabled, /color:\s*#7e8a82/);
  assert.match(disabled, /border-color:\s*#dbe3dc/);
  assert.match(disabled, /background:\s*#edf1ed/);
  assert.match(disabled, /opacity:\s*1/);
  assert.doesNotMatch(disabled, /var\(--cw-polish-green\)/);
});

test("mobile panel fills the viewport and preserves safe areas", async () => {
  const polish = await read("src/widget-polish.css");

  assert.match(polish, /@media \(max-width: 640px\)/);
  assert.match(polish, /width:\s*100vw/);
  assert.match(polish, /height:\s*100svh/);
  assert.match(polish, /height:\s*100dvh/);
  assert.match(polish, /env\(safe-area-inset-top\)/);
  assert.match(polish, /env\(safe-area-inset-bottom\)/);
  assert.match(polish, /data-assistant-open="true"/);
});

test("palette stays in one calm green family", async () => {
  const css = `${await read("src/product-widget.css")}\n${await read("src/widget-polish.css")}`.toLowerCase();

  for (const token of [
    "#ffffff",
    "#fbfcf9",
    "#1b8753",
    "#0d3b29",
    "#b3e9d0",
    "#edf7f1",
    "#10271c",
  ]) {
    assert.ok(css.includes(token), `Missing product token ${token}`);
  }

  for (const retired of ["#ffc79d", "#e58a5b", "#3478f6", "#1f55c9"]) {
    assert.ok(!css.includes(retired), `Retired accent ${retired} returned`);
  }
});
