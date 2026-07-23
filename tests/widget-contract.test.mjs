import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const ws = String.raw`\s*`;

test("demo and embed load one foundation and one authoritative redesign", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const foundation = await read("src/widget.css");

  for (const source of [main, embed]) {
    assert.match(source, /widget\.css/);
    assert.match(source, /assistant-redesign\.css/);
    assert.match(source, /installWidgetSpotlight/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 2);
  }

  for (const selector of [".cw-tabs", ".cw-rowcard", ".cw-inputbar", ".cw-next", ".cw-submit"]) {
    assert.ok(!foundation.includes(selector), `${selector} must not be defined in widget.css`);
  }
});

test("assistant order remains direct for non-technical business owners", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');

  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);
  assert.match(conversation, /Vyskladať riešenie/);
  assert.match(conversation, /5 krátkych krokov/);
  assert.match(conversation, /Čo mi to ušetrí\?/);
  assert.match(conversation, /Napíšte, čo riešite/);
});

test("mode switch is one rounded segmented control without pill geometry", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.match(css, new RegExp(String.raw`\.cw-tabs\{[^}]*border-radius:${ws}18px`));
  assert.match(css, new RegExp(String.raw`\.cw-tabs__glass\{[^}]*border-radius:${ws}14px`));
  assert.match(css, /\.cw-tabs\[data-mode="assistant"\] \.cw-tabs__glass/);
});

test("the redesign uses only the website black and blue palette", async () => {
  const css = await read("src/assistant-redesign.css");

  for (const token of ["#05070b", "#080d14", "#0d141f", "#111b2a", "#3478f6", "#4e8cff", "#f6f8fb"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing palette token ${token}`);
  }

  assert.doesNotMatch(css, /#2aa|#1fa|teal|turquoise|bronze|gold|green/i);
  assert.doesNotMatch(css, /!important/);
});

test("only primary CTAs and real quick chips use full oval geometry", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, new RegExp(String.raw`\.cw-chat-builder\{[^}]*border-radius:${ws}999px`));
  assert.match(css, new RegExp(String.raw`\.cw-next,\.cw-submit\{[^}]*border-radius:${ws}999px`));
  assert.match(css, new RegExp(String.raw`\.cw-quick-replies \.cw-chip\{[^}]*border-radius:${ws}999px`));
  assert.match(css, new RegExp(String.raw`\.cw-inputbar\{[^}]*border-radius:${ws}18px`));
  assert.match(css, new RegExp(String.raw`\.cw-direct-actions__grid a\{[^}]*border-radius:${ws}14px`));
  assert.match(css, /\.cw-next:active:not\(:disabled\),\.cw-submit:active:not\(:disabled\)\{transform:none;\}/);
});

test("calculator choices use balanced grids and one selected system", async () => {
  const css = await read("src/assistant-redesign.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const twoColumns = /repeat\(2,\s*minmax\(0,\s*1fr\)\)/;
  const threeRows = /repeat\(3,\s*minmax\(0,\s*1fr\)\)/;

  assert.match(css.match(/\.cw-choice-grid--interest,[^}]+\}/)?.[0] ?? "", twoColumns);
  assert.match(css.match(/\.cw-choice-grid--industry,[^}]+\}/)?.[0] ?? "", threeRows);
  assert.match(css, new RegExp(String.raw`\.cw-rowcard\{[^}]*border-radius:${ws}18px`));
  assert.match(css, /\.cw-rowcard::after,[^}]+transform:scaleX\(0\)/);
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::after,[^}]+scaleX\(1\)/);
  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.doesNotMatch(calculator, /cw-choice-arrow/);
});

test("selection indicator is one real aligned circular check", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, new RegExp(String.raw`\.cw-selection-indicator\{[^}]*width:${ws}21px`));
  assert.match(css, new RegExp(String.raw`\.cw-selection-indicator\{[^}]*border-radius:${ws}50%`));
  assert.match(css, /\.cw-selection-indicator\[data-visible="true"\]/);
  assert.doesNotMatch(css, /\.cw-selection-indicator::(?:before|after)/);
});

test("icons form one custom rounded line family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  for (const icon of ["attachment", "calculator", "calendar", "chat", "inquiry", "options", "phone", "spark", "tools"]) {
    assert.ok(icons.includes(`"${icon}"`), `Missing icon ${icon}`);
  }
  assert.match(css, /\.cw-rowcard__icon\{[^}]*color:var\(--mc-blue-hover\)/);
  assert.doesNotMatch(css, /\.cw-rowcard__icon\{[^}]*background:/);
  assert.doesNotMatch(css, /\.cw-scard__icon\{[^}]*background:/);
});

test("configurator remains five short steps with explicit selection guidance", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock = flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";

  assert.ok(stepsMatch);
  assert.equal((stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length, 5);
  assert.equal((featureBlock.match(/id:/g) ?? []).length, 6);
  assert.match(flow, /Vyberte jednu možnosť/);
  assert.match(flow, /Môžete vybrať viac možností/);
  assert.match(flow, /Odpovedať zákazníkom/);
  assert.match(flow, /Počítať cenu/);
  assert.match(flow, /Pomôcť s výberom/);
  assert.match(flow, /Nie som si istý/);
});

test("contact submits a real lead and keeps API protections", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const client = await read("src/lib/leadApi.ts");
  const api = await read("api/lead.ts");

  assert.match(calculator, /Meno a priezvisko \*/);
  assert.match(calculator, /E-mail \*/);
  assert.match(calculator, /await sendLead/);
  assert.match(client, /api\/lead/);
  assert.match(client, /AbortController/);
  assert.match(api, /RESEND_API_KEY/);
  assert.match(api, /rate-limit-exceeded/);
});

test("mobile full screen, safe areas and reduced motion remain safe", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /@media \(max-width:520px\)/);
  assert.match(css, /height:100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overscroll-behavior:none/);
});
