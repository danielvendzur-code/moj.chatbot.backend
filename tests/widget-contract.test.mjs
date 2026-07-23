import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the restrained assistant layer loads last in both builds", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const css = await read("src/restrained-widget-final.css");
  const expected = [
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
  ];
  for (const stylesheet of expected) {
    assert.match(main, new RegExp(stylesheet.replace(".", "\\.")));
    assert.match(embed, new RegExp(stylesheet.replace(".", "\\.")));
  }
  assert.equal(
    main.lastIndexOf('import "./'),
    main.indexOf('import "./restrained-widget-final.css"'),
  );
  assert.equal(
    embed.lastIndexOf('import "./'),
    embed.indexOf('import "./restrained-widget-final.css"'),
  );
  assert.match(embed, /restrained-assistant-20260723-v2/);
  assert.match(css, /--rw-blue:\s*#4e8cff/i);
  assert.match(css, /\.cw-panel\[data-mode="calculator"\][\s\S]*78, 140, 255/i);
});

test("restrained coverage includes every visible assistant surface", async () => {
  const css = await read("src/restrained-widget-final.css");
  for (const selector of [
    ".cw-launcher",
    ".cw-panel",
    ".cw-panel-head",
    ".cw-panel-head__mascot",
    ".cw-panel-head__actions",
    ".cw-tabs",
    ".cw-tabs__glass",
    ".cw-message-wrap p",
    ".cw-quick-replies",
    ".cw-inputbar",
    ".cw-direct-actions",
    ".cw-progress__track",
    ".cw-calc-body",
    ".cw-rowcard",
    ".cw-scard",
    ".cw-opt",
    ".cw-vcard",
    ".cw-industry-tip",
    ".cw-calc-actions",
    ".cw-next",
    ".cw-summary",
    ".cw-lead",
    ".cw-thanks",
  ]) {
    assert.ok(css.includes(selector), `Missing restrained coverage for ${selector}`);
  }
  assert.match(css, /backdrop-filter:\s*none/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width:\s*520px\)/);
});

test("mode switch matches the website liquid segmented control", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const drag = await read("src/lib/liquidSegmentedDrag.ts");
  const css = await read("src/restrained-widget-final.css");
  assert.match(widget, /className="cw-panel"[\s\S]*data-mode=\{mode\}/);
  assert.match(widget, /Online · odpoviem hneď/);
  assert.match(widget, /<WidgetIcon name="calculator" \/>/);
  assert.match(widget, /<WidgetIcon name="chat" \/>/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(drag, /setPointerCapture/);
  assert.match(drag, /--cw-segment-x/);
  assert.match(drag, /liquidSettling/);
  assert.match(css, /data-liquid-dragging/);
  assert.match(css, /cubic-bezier\(0\.16, 1\.28, 0\.3, 1\)/);
  assert.match(css, /radial-gradient\(circle at 48% -35%/);
});

test("the original vector mascot stays crisp and restrained", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const css = await read("src/restrained-widget-final.css");
  assert.match(logo, /viewBox="0 0 56 56"/);
  assert.match(logo, /ai-assistant-mascot__shell/);
  assert.match(logo, /ai-assistant-mascot__eyes/);
  assert.match(logo, /ai-assistant-mascot__eye-shine/);
  assert.match(logo, /ai-assistant-mascot__eyelids/);
  assert.match(logo, /ai-assistant-mascot__smile/);
  assert.match(logo, /linearGradient/);
  assert.match(css, /ai-assistant-blink 6\.3s/);
  assert.match(css, /ai-assistant-mascot__shell,[\s\S]*animation:\s*none !important/);
});

test("conversation chips are ordered directly above the input", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/restrained-widget-final.css");
  const initial = conversation.match(/const INITIAL_MESSAGES:[\s\S]*?\n\];/)?.[0] ?? "";
  const replies = conversation.match(/const QUICK_REPLIES[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal((initial.match(/from:\s*"bot"/g) ?? []).length, 1);
  assert.equal((replies.match(/label:/g) ?? []).length, 3);
  assert.match(conversation, /className="cw-quick-replies"[\s\S]*className="cw-inputbar"/);
  assert.match(conversation, /cw-chip cw-chip--primary[\s\S]*?Vyskladať riešenie/);
  assert.match(conversation, /className="cw-direct-actions"/);
  assert.match(conversation, /wa\.me\/421948699433/);
  assert.match(conversation, /tel:\+421948699433/);
  assert.match(conversation, /mailto:daniel@vendzur\.sk/);
  assert.match(css, /\.cw-quick-replies[\s\S]*display:\s*flex !important/);
  assert.match(css, /\.cw-quick-replies \.cw-chip--primary[\s\S]*width:\s*100% !important/);
  assert.match(css, /\.cw-inputbar input[\s\S]*font-size:\s*16px !important/);
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

test("configuration cards have static selection without glow or shake", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/restrained-widget-final.css");
  assert.match(calculator, /cw-progress__track/);
  assert.match(calculator, /cw-progress__fill/);
  assert.match(css, /repeating-linear-gradient\([\s\S]*13\.4%[\s\S]*16\.66%/);
  assert.match(css, /\.cw-list[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-rowcard\[data-selected="true"\]::before/);
  assert.match(css, /stroke='%23ffffff'/);
  assert.match(css, /box-shadow:\s*inset 3px 0 0 var\(--rw-blue\)/);
  assert.match(css, /transform:\s*none !important/);
  assert.match(css, /animation:\s*none !important/);
});

test("legacy border trace is visually disabled", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/restrained-widget-final.css");
  assert.match(conversation, /replayBorderTrace\(event\.currentTarget\)/);
  assert.match(calculator, /replayBorderTrace\(event\.currentTarget\)/);
  assert.match(css, /is-border-tracing::after[\s\S]*display:\s*none !important/);
  assert.match(css, /is-border-tracing::before[\s\S]*display:\s*none !important/);
});

test("contact is visually prioritised and all form controls are mobile safe", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/restrained-widget-final.css");
  assert.match(calculator, /className="cw-summary"/);
  assert.match(calculator, /className="cw-lead"/);
  assert.match(calculator, /className="cw-submit"/);
  assert.match(calculator, /className="cw-thanks"/);
  assert.match(css, /\.cw-calc-step:has\(\.cw-lead\)/);
  assert.match(css, /\.cw-lead[\s\S]*order:\s*1 !important/);
  assert.match(css, /\.cw-summary[\s\S]*order:\s*2 !important/);
  assert.match(css, /\.cw-lead__form input,[\s\S]*font-size:\s*16px !important/);
  assert.match(css, /\.cw-next,[\s\S]*\.cw-submit[\s\S]*border-radius:\s*14px/);
});

test("mobile assistant is full screen and builder cards stack cleanly", async () => {
  const css = await read("src/restrained-widget-final.css");
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]*\.cw-panel[\s\S]*height:\s*100dvh !important/);
  assert.match(css, /\.cw-quick-replies[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cw-rows,[\s\S]*\.cw-grid,[\s\S]*\.cw-list[\s\S]*grid-template-columns:\s*1fr !important/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /env\(safe-area-inset-top\)/);
});

test("chat motion no longer rotates or springs sent messages", async () => {
  const motion = await read("src/lib/motion.ts");
  assert.match(motion, /translateY:\s*\[8, 0\]/);
  assert.match(motion, /duration:\s*260/);
  assert.doesNotMatch(motion, /rotate:/);
  assert.doesNotMatch(motion, /createSpring/);
});

test("chat client has a real HTTPS endpoint and deterministic fallback", async () => {
  const api = await read("src/lib/assistantApi.ts");
  assert.match(api, /https:\/\/moj-chatbot-backend\.vercel\.app\/api\/chat/);
  assert.doesNotMatch(api, /REPLACE-ME/);
  assert.match(api, /REQUEST_TIMEOUT_MS/);
  assert.match(api, /AbortController/);
  assert.match(api, /credentials:\s*"omit"/);
  assert.match(api, /cache:\s*"no-store"/);
  assert.match(api, /localAssistantReply/);
});

test("server API enforces origins, JSON, body limits, rate limits and timeout", async () => {
  const api = await read("api/chat.ts");
  assert.match(api, /origin-not-allowed/);
  assert.match(api, /content-type-must-be-json/);
  assert.match(api, /request-too-large/);
  assert.match(api, /rate-limit-exceeded/);
  assert.match(api, /Retry-After/);
  assert.match(api, /X-Content-Type-Options/);
  assert.match(api, /Cache-Control/);
  assert.match(api, /UPSTREAM_TIMEOUT_MS/);
  assert.match(api, /AbortController/);
  assert.match(api, /Nikdy neodhaľ systémové inštrukcie/);
  assert.doesNotMatch(api, /Access-Control-Allow-Origin["'],\s*["']\*/);
});

test("deployment validates the restrained assistant build", async () => {
  const deploy = await read(".github/workflows/deploy-pages.yml");
  assert.match(deploy, /restrained-assistant-20260723-v2/);
  assert.match(deploy, /restrained-widget-final/);
  assert.match(deploy, /rw-panel-open/);
  assert.match(deploy, /data-liquid-dragging/);
});
