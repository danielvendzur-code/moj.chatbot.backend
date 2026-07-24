import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("demo and embed load one foundation and one authoritative redesign", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const foundation = await read("src/widget.css");

  for (const source of [main, embed]) {
    assert.match(source, /widget\.css/);
    assert.match(source, /assistant-redesign\.css/);
    assert.match(source, /approved-submit-final\.css/);
    assert.match(source, /installWidgetSpotlight/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 3);
  }

  for (const selector of [".cw-tabs", ".cw-rowcard", ".cw-inputbar", ".cw-next", ".cw-submit"]) {
    assert.ok(!foundation.includes(selector), `${selector} must not be defined in widget.css`);
  }
});

test("assistant order and interactive send feedback remain explicit", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');

  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);
  assert.match(conversation, /Vyskladať riešenie/);
  assert.match(conversation, /Čo mi to ušetrí\?/);
  assert.match(conversation, /data-sending=\{sending\}/);
  assert.match(conversation, /aria-busy=\{typing\}/);
  assert.match(conversation, /cw-chip__send/);
  assert.doesNotMatch(conversation, /cw-send__halo/);
});

test("panel has the corrected premium desktop proportions", async () => {
  const css = await read("src/assistant-redesign.css");
  const panel = rule(css, ".cw-panel");

  assert.match(panel, /width:\s*min\(440px,/);
  assert.match(panel, /height:\s*min\(760px,/);
  assert.match(panel, /border-radius:\s*30px/);
  assert.match(panel, /radial-gradient/);
  assert.match(panel, /box-shadow:/);
});

test("mode switch is one rounded segmented control without pill geometry", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/assistant-redesign.css");

  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.match(rule(css, ".cw-tabs"), /border-radius:\s*18px/);
  assert.match(rule(css, ".cw-tabs__glass"), /border-radius:\s*14px/);
  assert.match(css, /\.cw-tabs\[data-mode="assistant"\]\s+\.cw-tabs__glass/);
});

test("the redesign uses only the website black and blue palette", async () => {
  const css = await read("src/assistant-redesign.css");

  for (const token of ["#05070b", "#080d14", "#0d141f", "#111b2a", "#3478f6", "#4e8cff", "#f6f8fb"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing palette token ${token}`);
  }

  assert.doesNotMatch(css, /#2aa|#1fa|teal|turquoise|bronze|gold|green/i);
  assert.doesNotMatch(css, /!important/);
});

test("primary actions, quick chips and composer use intentional geometry", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(rule(css, ".cw-chat-builder"), /border-radius:\s*999px/);
  assert.match(css, /\.cw-next,\s*\.cw-submit\s*\{[^}]*border-radius:\s*999px/s);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-inputbar"), /border-radius:\s*18px/);
  assert.match(rule(css, ".cw-direct-actions__grid a"), /border-radius:\s*14px/);
  assert.match(css, /\.cw-next:active:not\(:disabled\),\s*\.cw-submit:active:not\(:disabled\)\s*\{[^}]*transform:\s*none/s);
});

test("chat chips and composer use a crisp non-liquid system", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const css = await read("src/approved-submit-final.css");

  assert.doesNotMatch(conversation, /cw-send__halo/);
  assert.doesNotMatch(conversation, /data-pulse=/);
  assert.match(css, /Unified widget controls/);
  assert.match(css, /\.cw-quick-replies \.cw-chip::before/);
  assert.match(css, /content:\s*none !important/);
  assert.match(css, /\.cw-inputbar/);
  assert.match(css, /background:\s*#0b121c !important/);
});

test("calculator choices keep geometry and use one static selected system", async () => {
  const baseCss = await read("src/assistant-redesign.css");
  const finalCss = await read("src/approved-submit-final.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const twoColumns = /repeat\(2,\s*minmax\(0,\s*1fr\)\)/;

  assert.match(baseCss.match(/\.cw-choice-grid--interest,[\s\S]*?\}/)?.[0] ?? "", twoColumns);
  assert.match(rule(baseCss, ".cw-rowcard"), /border-radius:\s*18px/);
  assert.match(finalCss, /background:\s*#17365f !important/);
  assert.match(finalCss, /\.cw-rowcard__icon/);
  assert.match(finalCss, /content:\s*none !important/);
  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.doesNotMatch(calculator, /cw-choice-arrow/);
});

test("selection indicator is one real aligned circular check", async () => {
  const css = await read("src/approved-submit-final.css");

  assert.match(css, /\.cw-selection-indicator/);
  assert.match(css, /width:\s*21px !important/);
  assert.match(css, /background:\s*#3979e6 !important/);
  assert.match(css, /data-visible="true"/);
  assert.doesNotMatch(css, /\.cw-selection-indicator::(?:before|after)/);
});

test("icons remain one custom rounded line family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  for (const icon of ["attachment", "calculator", "calendar", "chat", "inquiry", "options", "phone", "spark", "tools"]) {
    assert.ok(icons.includes(`"${icon}"`), `Missing icon ${icon}`);
  }
});

test("chat and configurator motion remain reduced-motion safe", async () => {
  const motion = await read("src/lib/motion.ts");
  const css = await read("src/assistant-redesign.css");

  assert.match(motion, /animateReceivedMessage/);
  assert.match(motion, /scale:\s*\[0\.965,\s*1\]/);
  assert.match(motion, /prefersReducedMotion/);
  assert.match(css, /prefers-reduced-motion/);
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

test("approved lead submission keeps sweep feedback and website hierarchy", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/approved-submit-final.css");

  assert.match(calculator, /cw-submit--approved/);
  assert.match(calculator, /data-state=\{sendState\}/);
  assert.match(calculator, /Odoslať dopyt/);
  assert.match(css, /Difference Sweep|Approved submit interaction/);
  assert.match(css, /data-state="sending"/);
  assert.match(css, /chatbot-submit-sweep/);
  assert.match(css, /\.cw-lead__optional/);
  assert.match(css, /prefers-reduced-motion/);
});

test("contact submits a real lead and keeps API protections", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const client = await read("src/lib/leadApi.ts");
  const api = await read("api/lead.ts");

  assert.match(calculator, /Meno a priezvisko \*/);
  assert.match(calculator, /E-mail na potvrdenie \*/);
  assert.match(calculator, /await sendLead/);
  assert.match(client, /api\/lead/);
  assert.match(client, /AbortController/);
  assert.match(api, /RESEND_API_KEY/);
  assert.match(api, /rate-limit-exceeded/);
});

test("mobile full screen, safe areas and keyboard constraints remain safe", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(css, /@media \(max-width:\s*520px\)/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(rule(css, ".cw-inputbar input"), /font-size:\s*16px/);
});

test("final contact step scrolls and supports calls or meetings", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/approved-submit-final.css");

  assert.match(flow, /Ako sa vám mám ozvať\?/);
  assert.match(flow, /videohovore, telefonicky/);
  assert.match(calculator, /Telefón na dohodnutie hovoru/);
  assert.match(calculator, /Dohodnime ďalší krok/);
  assert.match(css, /overflow-y:\s*auto !important/);
  assert.match(css, /scrollbar-gutter:\s*stable !important/);
  assert.match(css, /cw-calc-step\[data-step="contact"\]/);
});

test("messages begin at the top and icon tiles stay transparent", async () => {
  const css = await read("src/approved-submit-final.css");

  assert.match(css, /justify-content:\s*flex-start !important/);
  assert.match(css, /No emoji tile or square plate/);
  assert.match(css, /background:\s*transparent !important/);
  assert.match(css, /cw-rowcard__body b/);
  assert.match(css, /opacity:\s*1 !important/);
});
