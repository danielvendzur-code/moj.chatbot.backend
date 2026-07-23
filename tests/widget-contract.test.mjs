import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the Taste layer loads last in demo and embed builds", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const tasteCss = await read("src/taste-system-final.css");
  assert.match(main, /competition-winner-final\.css/);
  assert.match(embed, /competition-winner-final\.css/);
  assert.match(main, /taste-system-final\.css/);
  assert.match(embed, /taste-system-final\.css/);
  assert.equal(
    main.lastIndexOf('import "./'),
    main.indexOf('import "./taste-system-final.css"'),
  );
  assert.equal(
    embed.lastIndexOf('import "./'),
    embed.indexOf('import "./taste-system-final.css"'),
  );
  assert.match(embed, /taste-system-20260723-v7/);
  assert.match(tasteCss, /Taste-system final layer/);
});

test("assistant order remains builder messages chips input contacts", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');
  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);
  assert.match(conversation, /5 krátkych otázok/);
  assert.match(conversation, /Čo môže vyriešiť/);
  assert.doesNotMatch(conversation, /className="cw-chip cw-spotlight"/);
  assert.doesNotMatch(conversation, /label: "Cena od 350 €/);
});

test("mode tabs switch immediately without pointer capture", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const drag = await read("src/lib/liquidSegmentedDrag.ts");
  const css = await read("src/competition-winner-final.css");
  const tasteCss = await read("src/taste-system-final.css");
  assert.match(widget, /mode === "assistant" \? "calc\(100% \+ 5px\)" : "0px"/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.doesNotMatch(drag, /setPointerCapture/);
  assert.match(drag, /requestAnimationFrame/);
  assert.match(css, /\.cw-tabs__glass[\s\S]*pointer-events:\s*none !important/);
  assert.match(css, /\.cw-tabs > button[\s\S]*pointer-events:\s*auto !important/);
  assert.match(tasteCss, /transition: transform 420ms/);
  assert.match(tasteCss, /\.cw-tabs[\s\S]*border: 0 !important/);
});

test("spotlight is removed from chips and reserved for the builder CTA", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const tracker = await read("src/lib/widgetSpotlight.ts");
  const tasteCss = await read("src/taste-system-final.css");
  assert.match(main, /installWidgetSpotlight\(\)/);
  assert.match(embed, /installWidgetSpotlight\(\)/);
  assert.match(tracker, /--cw-spot-x/);
  assert.match(tracker, /dataset\.cwSpotlight/);
  assert.match(tracker, /requestAnimationFrame/);
  assert.match(tasteCss, /\.cw-spotlight::before/);
  assert.match(tasteCss, /\.cw-spotlight::after/);
  assert.match(tasteCss, /content: none !important/);
  assert.match(tasteCss, /\.cw-chat-builder\.cw-spotlight::after/);
  assert.match(tasteCss, /circle 88px at var\(--cw-spot-x\) var\(--cw-spot-y\)/);
});

test("quick replies are rounded borderless chips above a clean input", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/competition-winner-final.css");
  const tasteCss = await read("src/taste-system-final.css");
  const replies = conversation.match(/const QUICK_REPLIES[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal((replies.match(/label:/g) ?? []).length, 4);
  assert.match(css, /\.cw-quick-replies[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(tasteCss, /\.cw-quick-replies \.cw-chip[\s\S]*border-radius: 999px !important/);
  assert.match(tasteCss, /\.cw-quick-replies \.cw-chip[\s\S]*border: 0 !important/);
  assert.match(tasteCss, /\.cw-inputbar input[\s\S]*font-size: 16px !important/);
  assert.doesNotMatch(replies, /Cena od 350 €/);
});

test("configurator is five steps and contact remains final", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock = flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";
  assert.ok(stepsMatch);
  const steps = stepsMatch[1];
  assert.equal((steps.match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length, 5);
  assert.doesNotMatch(steps, /"volume"/);
  assert.match(steps, /"contact"/);
  assert.match(calculator, /Jednoduchý chatbot začína od 350 €/);
  assert.equal(
    (featureBlock.match(/id: "(faq|dopyty|email|cena|varianty|fotky|rezervacie|crm|jazyky)"/g) ?? [])
      .length,
    9,
  );
});

test("configuration choices are rounded borderless and fill without shrinking", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/competition-winner-final.css");
  const tasteCss = await read("src/taste-system-final.css");
  assert.doesNotMatch(calculator, /replayBorderTrace/);
  assert.match(calculator, /data-step=\{stepId\}/);
  assert.match(css, /data-step="interest"[\s\S]*repeat\(4, minmax\(62px, 1fr\)\)/);
  assert.match(css, /data-step="industry"[\s\S]*repeat\(3, minmax\(70px, 1fr\)\)/);
  assert.match(css, /data-step="features"[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /data-step="timeline"[\s\S]*repeat\(2, minmax\(105px, 1fr\)\)/);
  assert.match(tasteCss, /\.cw-rowcard,[\s\S]*border-radius: 18px !important/);
  assert.match(tasteCss, /\.cw-rowcard,[\s\S]*border: 0 !important/);
  assert.match(tasteCss, /transform: scaleX\(0\) !important/);
  assert.match(tasteCss, /data-selected="true"[\s\S]*transform: scaleX\(1\) !important/);
  assert.match(tasteCss, /\.cw-choice-arrow[\s\S]*display: none !important/);
  assert.match(tasteCss, /:active[\s\S]*transform: none !important/);
});

test("selected checks are circular and icon tiles are removed", async () => {
  const tasteCss = await read("src/taste-system-final.css");
  assert.match(tasteCss, /\.cw-rowcard\[data-selected="true"\]::before/);
  assert.match(tasteCss, /width: 20px !important/);
  assert.match(tasteCss, /border-radius: 999px !important/);
  assert.match(tasteCss, /\.cw-rowcard__icon,[\s\S]*background: transparent !important/);
  assert.match(tasteCss, /\.cw-chat-builder__icon[\s\S]*background: transparent !important/);
  assert.match(tasteCss, /stroke='%23fff'/);
});

test("the icon set is one refined rounded family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");
  assert.match(icons, /strokeWidth="1\.7"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  assert.match(icons, /vectorEffect="non-scaling-stroke"/);
  assert.match(icons, /focusable="false"/);
});

test("contact asks for essentials and submits a real lead", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const client = await read("src/lib/leadApi.ts");
  const api = await read("api/lead.ts");
  assert.match(calculator, /Meno a priezvisko \*/);
  assert.match(calculator, /E-mail \*/);
  assert.match(calculator, /cw-lead__optional/);
  assert.match(calculator, /await sendLead/);
  assert.doesNotMatch(calculator, /setTimeout\(\(\) => setSendState\("done"\)/);
  assert.match(client, /api\/lead/);
  assert.match(client, /AbortController/);
  assert.match(api, /RESEND_API_KEY/);
  assert.match(api, /LEAD_WEBHOOK_URL/);
  assert.match(api, /rate-limit-exceeded/);
  assert.match(api, /invalid-lead/);
  assert.match(api, /fallback/);
});

test("assistant knows the verified starting price and brand", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const chat = await read("api/chat.ts");
  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /AI asistent · online/);
  assert.match(conversation, /Ceny začínajú od 350 €/);
  assert.match(chat, /začína od 350 €/);
  assert.match(chat, /značky Môj Chatbot/);
  assert.match(chat, /Nevymýšľaj termíny, referencie, výsledky/);
});

test("mobile panel and controls remain safe", async () => {
  const css = await read("src/competition-winner-final.css");
  const tasteCss = await read("src/taste-system-final.css");
  assert.match(css, /@media \(max-width:\s*520px\)/);
  assert.match(css, /height:\s*100dvh !important/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.cw-lead__row[\s\S]*grid-template-columns:\s*1fr !important/);
  assert.match(tasteCss, /@media \(max-width: 520px\)/);
  assert.match(tasteCss, /prefers-reduced-motion/);
});

test("chat API protections remain intact", async () => {
  const client = await read("src/lib/assistantApi.ts");
  const api = await read("api/chat.ts");
  assert.match(client, /https:\/\/moj-chatbot-backend\.vercel\.app\/api\/chat/);
  assert.match(client, /AbortController/);
  assert.match(client, /localAssistantReply/);
  assert.match(api, /origin-not-allowed/);
  assert.match(api, /content-type-must-be-json/);
  assert.match(api, /request-too-large/);
  assert.match(api, /rate-limit-exceeded/);
  assert.match(api, /UPSTREAM_TIMEOUT_MS/);
  assert.doesNotMatch(api, /Access-Control-Allow-Origin["'],\s*["']\*/);
});

test("deployment validates the Taste build", async () => {
  const deploy = await read(".github/workflows/deploy-pages.yml");
  assert.match(deploy, /taste-system-20260723-v7/);
  assert.match(deploy, /taste-system-final/);
  assert.match(deploy, /competition-winner-final/);
  assert.match(deploy, /installWidgetSpotlight/);
  assert.match(deploy, /api\/lead/);
});
