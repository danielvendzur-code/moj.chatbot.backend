import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the website-palette correction loads last in demo and embed builds", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(main, /taste-system-final\.css/);
  assert.match(embed, /taste-system-final\.css/);
  assert.match(main, /web-palette-chatbot-final\.css/);
  assert.match(embed, /web-palette-chatbot-final\.css/);
  assert.equal(
    main.lastIndexOf('import "./'),
    main.indexOf('import "./web-palette-chatbot-final.css"'),
  );
  assert.equal(
    embed.lastIndexOf('import "./'),
    embed.indexOf('import "./web-palette-chatbot-final.css"'),
  );
  assert.match(embed, /web-palette-20260723-v8/);
  assert.match(finalCss, /Final chatbot-only correction/);
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
});

test("mode tabs switch immediately and use the website blue", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const drag = await read("src/lib/liquidSegmentedDrag.ts");
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(widget, /mode === "assistant" \? "calc\(100% \+ 5px\)" : "0px"/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.doesNotMatch(drag, /setPointerCapture/);
  assert.match(finalCss, /--cw-site-primary: #3979ec/);
  assert.match(finalCss, /\.cw-tabs__glass/);
});

test("spotlight is restricted to the builder CTA", async () => {
  const tracker = await read("src/lib/widgetSpotlight.ts");
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(tracker, /const SELECTOR = "\.cw-chat-builder\.cw-spotlight"/);
  assert.match(tracker, /--cw-spot-x/);
  assert.match(tracker, /requestAnimationFrame/);
  assert.match(finalCss, /\.cw-chat-builder/);
});

test("configurator keeps five steps and contact remains final", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock =
    flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";

  assert.ok(stepsMatch);
  assert.equal(
    (stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length,
    5,
  );
  assert.match(calculator, /Jednoduchý chatbot začína od 350 €/);
  assert.equal(
    (featureBlock.match(/id: "(faq|dopyty|email|cena|varianty|fotky|rezervacie|crm|jazyky)"/g) ?? [])
      .length,
    9,
  );
});

test("choices have no coloured border, square tile or malformed selection ring", async () => {
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(finalCss, /\.cw-rowcard,[\s\S]*border: 0 !important/);
  assert.match(finalCss, /\.cw-rowcard,[\s\S]*border-radius: 18px !important/);
  assert.match(finalCss, /\.cw-rowcard::before[\s\S]*content: none !important/);
  assert.match(finalCss, /\.cw-rowcard__icon,[\s\S]*background: transparent !important/);
  assert.match(finalCss, /\.cw-rowcard__icon,[\s\S]*border-radius: 0 !important/);
  assert.match(finalCss, /background: var\(--cw-site-surface-selected\) !important/);
  assert.doesNotMatch(finalCss, /#2aa|#1fa/i);
});

test("selected checks are circular, aligned and use the website blue", async () => {
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(finalCss, /\.cw-rowcard::after/);
  assert.match(finalCss, /width: 23px !important/);
  assert.match(finalCss, /border-radius: 999px !important/);
  assert.match(finalCss, /background-color: var\(--cw-site-primary\) !important/);
  assert.match(finalCss, /stroke='%23fff'/);
  assert.match(finalCss, /translateY\(-50%\) scale\(1\)/);
});

test("continue button uses only the website CTA palette", async () => {
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(finalCss, /\.cw-next[\s\S]*background: var\(--cw-site-primary\) !important/);
  assert.match(finalCss, /\.cw-next:hover[\s\S]*var\(--cw-site-primary-hover\)/);
  assert.match(finalCss, /\.cw-next:disabled[\s\S]*background: #111923 !important/);
  assert.doesNotMatch(finalCss, /linear-gradient\([^;]*(?:teal|#2aa|#1fa)/i);
});

test("the icon set remains one rounded family", async () => {
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
  assert.match(calculator, /await sendLead/);
  assert.match(client, /api\/lead/);
  assert.match(client, /AbortController/);
  assert.match(api, /RESEND_API_KEY/);
  assert.match(api, /LEAD_WEBHOOK_URL/);
  assert.match(api, /rate-limit-exceeded/);
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
});

test("mobile panel and reduced motion remain safe", async () => {
  const baseCss = await read("src/competition-winner-final.css");
  const finalCss = await read("src/web-palette-chatbot-final.css");

  assert.match(baseCss, /height:\s*100dvh !important/);
  assert.match(baseCss, /env\(safe-area-inset-top\)/);
  assert.match(baseCss, /env\(safe-area-inset-bottom\)/);
  assert.match(finalCss, /@media \(max-width: 520px\)/);
  assert.match(finalCss, /prefers-reduced-motion/);
});

test("chat API protections remain intact", async () => {
  const client = await read("src/lib/assistantApi.ts");
  const api = await read("api/chat.ts");

  assert.match(client, /https:\/\/moj-chatbot-backend\.vercel\.app\/api\/chat/);
  assert.match(client, /AbortController/);
  assert.match(api, /origin-not-allowed/);
  assert.match(api, /content-type-must-be-json/);
  assert.match(api, /rate-limit-exceeded/);
  assert.match(api, /UPSTREAM_TIMEOUT_MS/);
  assert.doesNotMatch(api, /Access-Control-Allow-Origin["'],\s*["']\*/);
});

test("deployment validates the website-palette build", async () => {
  const deploy = await read(".github/workflows/deploy-pages.yml");

  assert.match(deploy, /web-palette-20260723-v8/);
  assert.match(deploy, /web-palette-chatbot-final/);
  assert.match(deploy, /taste-system-final/);
  assert.match(deploy, /installWidgetSpotlight/);
  assert.match(deploy, /api\/lead/);
});
