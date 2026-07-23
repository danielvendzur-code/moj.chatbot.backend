import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("demo and embed use one redesign layer with the restrained builder spotlight", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");

  for (const source of [main, embed]) {
    assert.match(source, /widget\.css/);
    assert.match(source, /assistant-redesign\.css/);
    assert.match(source, /installWidgetSpotlight/);
    assert.doesNotMatch(source, /taste-system-final|web-palette-chatbot-final|competition-winner-final/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 2);
  }

  assert.match(embed, /competition-redesign-20260723-v10/);
});

test("assistant order is clear for non-technical business owners", async () => {
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

test("mode switch stays direct React state and visually moves as one oval", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.doesNotMatch(main, /installLiquidSegmentedDrag|installWidgetRailDrag/);
  assert.doesNotMatch(embed, /installLiquidSegmentedDrag/);
  assert.match(css, /\.cw-tabs[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-tabs__glass[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-tabs\[data-mode="assistant"\] \.cw-tabs__glass/);
});

test("the redesign uses only the website black and blue palette", async () => {
  const css = await read("src/assistant-redesign.css");

  for (const token of ["#05070b", "#080d14", "#0d141f", "#111b2a", "#3478f6", "#4e8cff", "#f6f8fb"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing palette token ${token}`);
  }
  assert.doesNotMatch(css, /#2aa|#1fa|teal|turquoise/i);
});

test("primary actions are equal ovals and never shrink", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /\.cw-chat-builder[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-next,[\s\S]*\.cw-submit[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-inputbar[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-quick-replies \.cw-chip[\s\S]*border-radius: 999px/);
  assert.match(css, /\.cw-next:active:not\(:disabled\)[\s\S]*transform: none/);
});

test("calculator choices use balanced grids instead of full width rows", async () => {
  const css = await read("src/assistant-redesign.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");

  assert.match(css, /\.cw-choice-grid--interest,[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-choice-grid--industry,[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-rowcard[\s\S]*border-radius: 20px/);
  assert.match(css, /\.cw-rowcard::after[\s\S]*transform: scaleX\(0\)/);
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::after[\s\S]*scaleX\(1\)/);
  assert.match(calculator, /cw-choice-grid--interest/);
  assert.match(calculator, /cw-choice-grid--features/);
  assert.doesNotMatch(calculator, /cw-choice-arrow/);
});

test("selection state uses one aligned circular check", async () => {
  const css = await read("src/assistant-redesign.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");

  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.match(css, /\.cw-selection-indicator[\s\S]*width: 23px/);
  assert.match(css, /\.cw-selection-indicator[\s\S]*border-radius: 50%/);
  assert.match(css, /\.cw-selection-indicator\[data-visible="true"\]/);
});

test("icons form one rounded line family without tile backgrounds", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  assert.match(icons, /\| "options"/);
  assert.match(css, /\.cw-rowcard__icon[\s\S]*color: var\(--mc-blue-hover\)/);
  assert.doesNotMatch(css, /\.cw-rowcard__icon\s*\{[^}]*background:/);
  assert.doesNotMatch(css, /\.cw-scard__icon\s*\{[^}]*background:/);
});

test("configurator remains five short steps with six essential features", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock = flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";

  assert.ok(stepsMatch);
  assert.equal(
    (stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length,
    5,
  );
  assert.equal((featureBlock.match(/id:/g) ?? []).length, 6);
  assert.match(flow, /Čo má váš web vybaviť za vás\?/);
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

test("mobile full screen and reduced motion remain safe", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("deployment validates competition redesign v10", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /competition-redesign-20260723-v10/);
  assert.match(workflow, /assistant-redesign/);
  assert.match(workflow, /installWidgetSpotlight/);
  assert.match(workflow, /api\/lead/);
});
