import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("demo and embed use only the base stylesheet and one redesign layer", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");

  for (const source of [main, embed]) {
    assert.match(source, /widget\.css/);
    assert.match(source, /assistant-redesign\.css/);
    assert.doesNotMatch(source, /taste-system-final|web-palette-chatbot-final|competition-winner-final/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 2);
  }

  assert.match(embed, /clean-redesign-20260723-v9/);
});

test("assistant order is clear and designed for non-technical business owners", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');

  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);
  assert.match(conversation, /Nechať sa previesť výberom/);
  assert.match(conversation, /Čo mi to ušetrí\?/);
  assert.match(conversation, /Napíšte, čo riešite/);
});

test("mode switch is direct React state without legacy drag installers", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.doesNotMatch(main, /installLiquidSegmentedDrag|installWidgetSpotlight|installWidgetRailDrag/);
  assert.doesNotMatch(embed, /installLiquidSegmentedDrag|installWidgetSpotlight/);
  assert.match(css, /\.cw-tabs\[data-mode="assistant"\] \.cw-tabs__glass/);
});

test("the redesign uses the website palette and no teal or green CTA colours", async () => {
  const css = await read("src/assistant-redesign.css");

  for (const token of ["#05070b", "#0a0f17", "#0d141f", "#3478f6", "#4e8cff", "#f6f8fb"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing palette token ${token}`);
  }
  assert.doesNotMatch(css, /#2aa|#1fa|teal|turquoise/i);
});

test("choice cards are rounded borderless and never shrink", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /\.cw-rowcard,[\s\S]*border: 0/);
  assert.match(css, /\.cw-rowcard[\s\S]*border-radius: 18px/);
  assert.match(css, /\.cw-rowcard::after[\s\S]*transform: scaleX\(0\)/);
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::after[\s\S]*scaleX\(1\)/);
  assert.doesNotMatch(css, /:active[\s\S]*scale\(0\.[0-9]+\)/);
});

test("selection check is circular and aligned on the right", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::before/);
  assert.match(css, /width: 23px/);
  assert.match(css, /border-radius: 50%/);
  assert.match(css, /right: 13px/);
  assert.match(css, /translateY\(-50%\)/);
});

test("icons form one rounded line family without tile backgrounds", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(icons, /strokeWidth="1\.8"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  assert.match(icons, /vectorEffect="non-scaling-stroke"/);
  assert.match(css, /\.cw-rowcard__icon,[\s\S]*color: var\(--mc-blue-hover\)/);
  assert.doesNotMatch(css, /\.cw-rowcard__icon[\s\S]*background:/);
});

test("configurator remains five steps with simpler business language", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);

  assert.ok(stepsMatch);
  assert.equal(
    (stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length,
    5,
  );
  assert.match(flow, /Čo má váš web vybaviť za vás\?/);
  assert.match(flow, /Odpovedať zákazníkom/);
  assert.match(flow, /Počítať cenu/);
  assert.match(flow, /Pomôcť s výberom/);
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

test("mobile full screen and reduced motion are covered", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("deployment validates clean redesign v9", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /clean-redesign-20260723-v9/);
  assert.match(workflow, /assistant-redesign/);
  assert.match(workflow, /api\/lead/);
});
