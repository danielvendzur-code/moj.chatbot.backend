import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("final visual system uses black, white and blue with a darker blue hover", async () => {
  const css = await read("src/black-blue-refresh.css");
  assert.match(css, /--cw-bg:\s*#050609/i);
  assert.match(css, /--cw-ink:\s*#f7f9fc/i);
  assert.match(css, /--cw-action:\s*#3478f6/i);
  assert.match(css, /--cw-action-hover:\s*#1f55c9/i);
  assert.match(
    css,
    /\.cw-panel-head__actions \.cw-panel-head__close:hover[\s\S]*?background:\s*#1f55c9/i,
  );
  assert.doesNotMatch(
    css,
    /#65e6c1|#83f1d0|#72c7ff|#ff6c67|#c9aa70|#c47c5e|#d9bc84/i,
  );
});

test("demo and embedded builds import the identical final style stack", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const deploy = await read(".github/workflows/deploy-pages.yml");
  const expected = [
    "widget.css",
    "interaction.css",
    "requested-polish.css",
    "world-class-polish.css",
    "competition-widget.css",
    "black-blue-refresh.css",
    "conversion-brand.css",
  ];
  for (const stylesheet of expected) {
    assert.match(main, new RegExp(stylesheet.replace(".", "\\.")));
    assert.match(embed, new RegExp(stylesheet.replace(".", "\\.")));
  }
  assert.match(main, /black-blue-refresh\.css[\s\S]*conversion-brand\.css/);
  assert.match(embed, /black-blue-refresh\.css[\s\S]*conversion-brand\.css/);
  assert.match(embed, /data-dv-assistant-version/);
  assert.match(embed, /conversion-brand-20260723/);
  assert.match(deploy, /conversion-brand-20260723/);
  assert.doesNotMatch(deploy, /black-blue-20260722/);
});

test("mode tabs switch directly through a branded liquid-glass control", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/conversion-brand.css");
  assert.match(widget, /<i aria-hidden="true" \/> Online/);
  assert.match(widget, />Môj Chatbot</);
  assert.match(widget, /className="cw-tabs__glass"/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.doesNotMatch(widget, /onPointerMove=\{handleTabPointerMove\}/);
  assert.match(css, /\.cw-widget \.cw-tabs__glass[\s\S]*display:\s*block !important/);
  assert.match(css, /760ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.match(css, /cw-glass-shimmer-a/);
  assert.match(css, /cw-glass-shimmer-b/);
});

test("builder flow omits priority and keeps contact as final step", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(stepsMatch, "STEPS definition missing");
  const steps = stepsMatch[1];
  assert.doesNotMatch(steps, /"priority"/);
  assert.match(steps, /"contact"\s*,?\s*$/m);
  assert.match(flow, /whatsapp/);
  assert.match(flow, /volanie/);
  assert.match(flow, /platba/);
});

test("final screen visually orders contact before summary", async () => {
  const css = await read("src/requested-polish.css");
  assert.match(css, /> \.cw-lead \{ order: 1; \}/);
  assert.match(css, /> \.cw-summary \{ order: 2;/);
});

test("quick replies never drag sideways and mobile inputs prevent browser zoom", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/black-blue-refresh.css");
  assert.doesNotMatch(conversation, /useHorizontalDrag|quickRepliesDrag/);
  assert.doesNotMatch(conversation, /label:\s*"Konfigurátor"/);
  const replies =
    conversation.match(/const QUICK_REPLIES[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal((replies.match(/label:/g) ?? []).length, 3);
  assert.match(
    conversation,
    /cw-chip cw-chip--primary[\s\S]*?Vyskladať riešenie/,
  );
  assert.match(
    css,
    /\.cw-quick-replies[\s\S]*?grid-template-columns:\s*repeat\(2/i,
  );
  assert.match(css, /touch-action:\s*pan-y/i);
  assert.match(css, /font-size:\s*16px !important/i);
  assert.match(css, /height:\s*100dvh !important/i);
  assert.match(conversation, /animateChipsIn\(chipsRef\.current\)/);
  assert.match(conversation, /ref=\{chipsRef\}/);
  assert.doesNotMatch(conversation, /setTimeout\(onOpenCalculator/);
});

test("choices use nested symmetric border tracing, liquid glide and centred SVG states", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/conversion-brand.css");
  assert.match(conversation, /replayBorderTrace\(event\.currentTarget\)/);
  assert.match(calculator, /replayBorderTrace\(event\.currentTarget\)/);
  assert.match(conversation, /className="cw-selection-trace"/);
  assert.match(calculator, /className="cw-selection-trace"/);
  assert.match(calculator, /<HoverGlide[\s\S]*?park/);
  assert.match(calculator, /data-glide/);
  assert.match(calculator, /className="cw-card-state"/);
  assert.match(calculator, /name=\{selected \? "check" : "arrow"\}/);
  assert.match(calculator, /cw-opt__radio[\s\S]*?<WidgetIcon name="check"/);
  assert.match(css, /@property --cw-trace-sweep/);
  assert.match(css, /from 270deg/);
  assert.match(css, /calc\(360deg - var\(--cw-trace-sweep\)\)/);
  assert.match(css, /padding:\s*2\.5px/);
  assert.match(css, /\.is-border-tracing > \.cw-selection-trace/);
  assert.match(css, /\.cw-widget \.cw-glide[\s\S]*display:\s*block !important/);
});

test("public demo and conversation consistently use the Môj Chatbot brand", async () => {
  const app = await read("src/App.tsx");
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const page = await read("index.html");
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  assert.match(app, /Môj Chatbot/);
  assert.match(widget, /Môj Chatbot/);
  assert.match(conversation, /som Môj Chatbot/);
  assert.match(page, /<title>Môj Chatbot/);
  assert.match(logo, /#3478f6/);
  assert.match(logo, /M15 28\.5v-4\.1l9 5\.7 9-5\.7v4\.1/);
  assert.doesNotMatch(widget, /Danielov webový asistent/);
});

test("chat client has a real HTTPS endpoint, timeout and deterministic outage fallback", async () => {
  const api = await read("src/lib/assistantApi.ts");
  assert.match(api, /https:\/\/moj-chatbot-backend\.vercel\.app\/api\/chat/);
  assert.doesNotMatch(api, /REPLACE-ME/);
  assert.match(api, /REQUEST_TIMEOUT_MS/);
  assert.match(api, /AbortController/);
  assert.match(api, /credentials:\s*"omit"/);
  assert.match(api, /cache:\s*"no-store"/);
  assert.match(api, /localAssistantReply/);
});

test("server API enforces origins, JSON, body limits, rate limits and upstream timeout", async () => {
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

test("final styles cover every major chatbot surface and reduced motion", async () => {
  const css = await read("src/black-blue-refresh.css");
  for (const selector of [
    ".cw-launcher",
    ".cw-teaser",
    ".cw-panel",
    ".cw-panel-head",
    ".cw-tabs",
    ".cw-message-wrap p",
    ".cw-chip",
    ".cw-inputbar",
    ".cw-progress__fill",
    ".cw-rowcard",
    ".cw-scard",
    ".cw-opt",
    ".cw-vcard",
    ".cw-summary",
    ".cw-lead",
    ".cw-next",
    ".cw-submit",
    ".cw-thanks",
  ]) {
    assert.ok(css.includes(selector), `Missing final style for ${selector}`);
  }
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /focus-visible/);
});
