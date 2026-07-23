import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the Derat layout layer loads last in demo and embed builds", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/derat-layout-final.css");
  for (const stylesheet of [
    "widget.css",
    "interaction.css",
    "requested-polish.css",
    "world-class-polish.css",
    "competition-widget.css",
    "flow-content-polish.css",
    "black-blue-refresh.css",
    "premium-liquid-final.css",
    "chip-refinement-final.css",
    "apple-liquid-fixes.css",
    "apple-liquid-system-final.css",
    "restrained-widget-final.css",
    "derat-layout-final.css",
  ]) {
    assert.match(main, new RegExp(stylesheet.replace(".", "\\.")));
    assert.match(embed, new RegExp(stylesheet.replace(".", "\\.")));
  }
  assert.equal(main.lastIndexOf('import "./'), main.indexOf('import "./derat-layout-final.css"'));
  assert.equal(embed.lastIndexOf('import "./'), embed.indexOf('import "./derat-layout-final.css"'));
  assert.match(embed, /derat-layout-20260723-v3/);
  assert.match(css, /Order: builder CTA -> messages -> quick chips -> input -> direct contacts/);
});

test("assistant layout follows the Derat order exactly", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');
  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips);
  assert.ok(chips < input);
  assert.ok(input < contacts);
  assert.match(conversation, /Vyskladať riešenie/);
  assert.match(conversation, /Chatbot, kalkulačka alebo konfigurátor podľa vášho webu/);
  assert.match(conversation, /Kontaktujte ma priamo/);
});

test("the builder CTA switches immediately without a delayed border trace", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  assert.match(conversation, /const openCalculator = \(\) =>/);
  assert.match(conversation, /onOpenCalculator\(\)/);
  assert.match(conversation, /className="cw-chat-builder" onClick=\{openCalculator\}/);
  assert.doesNotMatch(conversation, /setTimeout\(onOpenCalculator/);
  assert.doesNotMatch(conversation, /replayBorderTrace/);
});

test("mode tabs remain clickable and the indicator starts under the active mode", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const drag = await read("src/lib/liquidSegmentedDrag.ts");
  const css = await read("src/derat-layout-final.css");
  assert.match(widget, /--cw-segment-x/);
  assert.match(widget, /mode === "assistant" \? "calc\(100% \+ 6px\)" : "0px"/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(drag, /setPointerCapture/);
  assert.match(drag, /buttons\[nextIndex\]\.click\(\)/);
  assert.match(css, /\.cw-tabs__glass[\s\S]*pointer-events:\s*none !important/);
  assert.match(css, /\.cw-tabs > button[\s\S]*cursor:\s*pointer !important/);
});

test("quick replies are one consistent chip family directly above the input", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/derat-layout-final.css");
  const replies = conversation.match(/const QUICK_REPLIES[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal((replies.match(/label:/g) ?? []).length, 3);
  assert.doesNotMatch(conversation, /cw-chip--primary/);
  assert.match(css, /\.cw-quick-replies[\s\S]*display:\s*flex !important/);
  assert.match(css, /\.cw-quick-replies \.cw-chip[\s\S]*border-radius:\s*999px/);
  assert.match(css, /\.cw-inputbar[\s\S]*margin:\s*0 12px 10px/);
});

test("direct contacts use the same three-card bottom bar as Derat", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/derat-layout-final.css");
  assert.match(conversation, /wa\.me\/421948699433/);
  assert.match(conversation, /tel:\+421948699433/);
  assert.match(conversation, /mailto:daniel@vendzur\.sk/);
  assert.match(css, /\.cw-direct-actions__grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-direct-actions__grid a[\s\S]*flex-direction:\s*column !important/);
});

test("the configurator fills the available vertical space", async () => {
  const css = await read("src/derat-layout-final.css");
  assert.match(css, /\.cw-calc-body[\s\S]*display:\s*flex !important/);
  assert.match(css, /\.cw-calc-step[\s\S]*min-height:\s*100% !important/);
  assert.match(css, /:has\(> \.cw-rows\)[\s\S]*repeat\(5, minmax\(60px, 1fr\)\)/);
  assert.match(css, /:has\(> \.cw-grid:not\(\.cw-grid--volume\)\)[\s\S]*repeat\(3, minmax\(72px, 1fr\)\)/);
  assert.match(css, /:has\(> \.cw-grid--volume\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
});

test("configuration cards have no selected side line, shake or glow", async () => {
  const css = await read("src/derat-layout-final.css");
  assert.match(css, /Selected cards: no side line, no shake, no glow/);
  assert.match(css, /\.cw-rowcard\[data-selected="true"\][\s\S]*background:\s*#132039 !important/);
  assert.match(css, /box-shadow:\s*0 0 0 1px rgba\(78, 140, 255, 0\.08\) !important/);
  assert.doesNotMatch(css, /inset 3px 0 0/);
  assert.match(css, /transform:\s*none !important/);
  assert.match(css, /animation:\s*none !important/);
});

test("selected checks are static, small and correctly aligned", async () => {
  const css = await read("src/derat-layout-final.css");
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::before/);
  assert.match(css, /width:\s*18px !important/);
  assert.match(css, /height:\s*18px !important/);
  assert.match(css, /stroke='%23ffffff'/);
  assert.match(css, /animation:\s*none !important/);
});

test("builder flow remains short and contact stays final", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(stepsMatch, "STEPS definition missing");
  const steps = stepsMatch[1];
  assert.doesNotMatch(steps, /"priority"/);
  assert.match(steps, /"contact"\s*,?\s*$/m);
  assert.equal((steps.match(/"(interest|industry|features|volume|timeline|contact)"/g) ?? []).length, 6);
});

test("mobile keeps two-column Derat cards and a full-screen panel", async () => {
  const restrained = await read("src/restrained-widget-final.css");
  const css = await read("src/derat-layout-final.css");
  assert.match(restrained, /@media \(max-width:\s*520px\)[\s\S]*\.cw-panel[\s\S]*height:\s*100dvh !important/);
  assert.match(css, /@media \(max-width:\s*520px\)/);
  assert.match(css, /\.cw-calc-step:has\(> \.cw-list\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-calc-step:has\(> \.cw-grid--volume\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("form controls remain mobile-safe and contact is prioritised", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const restrained = await read("src/restrained-widget-final.css");
  assert.match(calculator, /className="cw-summary"/);
  assert.match(calculator, /className="cw-lead"/);
  assert.match(calculator, /className="cw-submit"/);
  assert.match(restrained, /\.cw-calc-step:has\(\.cw-lead\)/);
  assert.match(restrained, /\.cw-lead__form input,[\s\S]*font-size:\s*16px !important/);
});

test("chat motion remains calm", async () => {
  const motion = await read("src/lib/motion.ts");
  assert.match(motion, /translateY:\s*\[8, 0\]/);
  assert.match(motion, /duration:\s*260/);
  assert.doesNotMatch(motion, /rotate:/);
  assert.doesNotMatch(motion, /createSpring/);
});

test("chat API and server protections remain intact", async () => {
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

test("deployment validates the Derat layout build", async () => {
  const deploy = await read(".github/workflows/deploy-pages.yml");
  assert.match(deploy, /derat-layout-20260723-v3/);
  assert.match(deploy, /derat-layout-final/);
  assert.match(deploy, /cw-chat-builder/);
  assert.match(deploy, /data-liquid-dragging/);
});
