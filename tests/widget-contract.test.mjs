import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the competition layer loads last in demo and embed builds", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/competition-winner-final.css");
  assert.match(main, /competition-winner-final\.css/);
  assert.match(embed, /competition-winner-final\.css/);
  assert.equal(
    main.lastIndexOf('import "./'),
    main.indexOf('import "./competition-winner-final.css"'),
  );
  assert.equal(
    embed.lastIndexOf('import "./'),
    embed.indexOf('import "./competition-winner-final.css"'),
  );
  assert.match(embed, /competition-winner-20260723-v5/);
  assert.match(css, /Final assistant system/);
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
  assert.match(conversation, /5 krátkych krokov/);
  assert.match(conversation, /Cena od 350 €/);
});

test("mode tabs switch immediately and glass cannot block clicks", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const drag = await read("src/lib/liquidSegmentedDrag.ts");
  const css = await read("src/competition-winner-final.css");
  assert.match(widget, /mode === "assistant" \? "calc\(100% \+ 5px\)" : "0px"/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(drag, /setPointerCapture/);
  assert.match(css, /\.cw-tabs__glass[\s\S]*pointer-events:\s*none !important/);
  assert.match(css, /\.cw-tabs > button[\s\S]*pointer-events:\s*auto !important/);
});

test("spotlight uses one pointer tracker and restrained radial light", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const tracker = await read("src/lib/widgetSpotlight.ts");
  const css = await read("src/competition-winner-final.css");
  assert.match(main, /installWidgetSpotlight\(\)/);
  assert.match(embed, /installWidgetSpotlight\(\)/);
  assert.match(tracker, /--cw-spot-x/);
  assert.match(tracker, /data\.cwSpotlight/);
  assert.match(tracker, /requestAnimationFrame/);
  assert.match(css, /circle at var\(--cw-spot-x\) var\(--cw-spot-y\)/);
  assert.match(css, /\.cw-spotlight\[data-cw-spotlight="true"\]::after/);
});

test("quick replies are balanced two by two above the input", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/competition-winner-final.css");
  const replies = conversation.match(/const QUICK_REPLIES[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal((replies.match(/label:/g) ?? []).length, 4);
  assert.match(css, /\.cw-quick-replies[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-inputbar input[\s\S]*font-size:\s*16px !important/);
});

test("configurator is five steps and contact remains final", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(stepsMatch);
  const steps = stepsMatch[1];
  assert.equal((steps.match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length, 5);
  assert.doesNotMatch(steps, /"volume"/);
  assert.match(steps, /"contact"/);
  assert.match(flow, /Jednoduchý chatbot/);
  assert.equal((flow.match(/id: "(faq|dopyty|email|cena|varianty|fotky|rezervacie|crm|jazyky)"/g) ?? []).length, 9);
});

test("configuration cards fill space without forced shake or side stripe", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/competition-winner-final.css");
  assert.doesNotMatch(calculator, /replayBorderTrace/);
  assert.match(calculator, /data-step=\{stepId\}/);
  assert.match(css, /data-step="interest"[\s\S]*repeat\(4, minmax\(62px, 1fr\)\)/);
  assert.match(css, /data-step="industry"[\s\S]*repeat\(3, minmax\(70px, 1fr\)\)/);
  assert.match(css, /data-step="features"[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /data-step="timeline"[\s\S]*repeat\(2, minmax\(105px, 1fr\)\)/);
  assert.doesNotMatch(css, /inset 3px 0 0/);
  assert.match(css, /animation:\s*none !important/);
});

test("selected checks are small static and aligned", async () => {
  const css = await read("src/competition-winner-final.css");
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::before/);
  assert.match(css, /width:\s*18px !important/);
  assert.match(css, /stroke='%23fff'/);
  assert.match(css, /transform:\s*none !important/);
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
  const chat = await read("api/chat.ts");
  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /AI asistent · online/);
  assert.match(chat, /začína od 350 €/);
  assert.match(chat, /značky Môj Chatbot/);
  assert.match(chat, /Nevymýšľaj termíny, referencie, výsledky/);
});

test("mobile panel and controls remain safe", async () => {
  const css = await read("src/competition-winner-final.css");
  assert.match(css, /@media \(max-width:\s*520px\)/);
  assert.match(css, /height:\s*100dvh !important/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.cw-lead__row[\s\S]*grid-template-columns:\s*1fr !important/);
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

test("deployment validates the competition build", async () => {
  const deploy = await read(".github/workflows/deploy-pages.yml");
  assert.match(deploy, /competition-winner-20260723-v5/);
  assert.match(deploy, /competition-winner-final/);
  assert.match(deploy, /installWidgetSpotlight/);
  assert.match(deploy, /api\/lead/);
});
