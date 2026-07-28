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
    assert.match(source, /final-user-correction\.css/);
    assert.doesNotMatch(source, /installWidgetSpotlight/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 4);
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
  assert.doesNotMatch(conversation, /cw-chip__send/);
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
  const css = await read("src/approved-submit-final.css");

  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.doesNotMatch(widget, /cw-tabs__glass/);
  assert.match(css, /Visible widget rebuild/);
  assert.match(css, /grid-template-columns:\s*1fr 1fr !important/);
  assert.match(css, /\.cw-tabs > button\[data-active="true"\]/);
  assert.match(css, /background:\s*#0fa568 !important/);
});

test("the redesign uses only the website black and green palette", async () => {
  const css = await read("src/assistant-redesign.css");

  // dark base stays dark; the accents are the website's three greens
  for (const token of ["#05070b", "#080d14", "#0d141f", "#111b2a", "#16c47f", "#0fa568", "#7fe0b4", "#f6f8fb"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing palette token ${token}`);
  }

  // the blues the website moved away from must not come back
  for (const gone of ["#3478f6", "#1f55c9", "#8ab4ff", "#78a9ff", "#4e8cff", "#2868c8", "#245fae"]) {
    assert.ok(!css.toLowerCase().includes(gone), `Blue ${gone} is back in the palette`);
  }

  assert.doesNotMatch(css, /teal|turquoise|bronze|gold/i);
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
  assert.match(css, /background:\s*#16c47f !important/);
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
  assert.match(flow, /AI chatbot/);
  assert.match(flow, /Chatbot s kalkulačkou/);
  assert.match(flow, /Chatbot s konfigurátorom/);
  assert.match(flow, /Neviem, poraďte mi/);
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
  assert.match(calculator, /E-mail \(voliteľné\)/);
  assert.match(calculator, /CONTACT_METHODS/);
  assert.match(calculator, /Osobné stretnutie/);
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

  assert.match(flow, /Kam vám mám poslať návrh\?/);
  assert.match(calculator, /Osobné stretnutie/);
  assert.match(calculator, /Telefón \*/);
  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /Videohovor/);
  // The sticky footer carries the submit button, not a duplicate restart that
  // pushed "Odoslať dopyt" below the fold. Restart stays in the panel header.
  assert.match(calculator, /cw-calc-actions--final[\s\S]*?data-testid="lead-submit"/);
  assert.doesNotMatch(calculator, /cw-restart/);
  assert.doesNotMatch(calculator, /Dohodnime ďalší krok/);
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

test("final user correction centers quick replies and keeps one input shape", async () => {
  const css = await read("src/final-user-correction.css");
  const conversation = await read("src/components/widget/AssistantConversation.tsx");

  for (const label of ["Čo mi to ušetrí?", "Ako to funguje?", "Čo treba pripraviť?", "Pozrieť ukážky"]) {
    assert.match(conversation, new RegExp(label.replace(/[?]/g, "\\?")));
  }
  assert.match(css, /Final correction/);
  assert.match(css, /transform:\s*scaleX\(0\) !important/);
  assert.match(css, /transform-origin:\s*center !important/);
  assert.match(css, /justify-content:\s*center !important/);
  assert.match(css, /\.cw-inputbar,\s*html body \.cw-widget \.cw-inputbar:focus-within/);
  assert.match(css, /border-radius:\s*15px !important/);
});

test("final configurator correction removes clipping, icon tiles and selected stripes", async () => {
  const css = await read("src/final-user-correction.css");

  assert.match(css, /grid-auto-rows:\s*minmax\(122px, auto\) !important/);
  assert.match(css, /max-height:\s*none !important/);
  assert.match(css, /overflow:\s*visible !important/);
  assert.match(css, /\.cw-rowcard__icon[\s\S]*background:\s*transparent !important/);
  assert.match(css, /\.cw-selection-indicator svg[\s\S]*transform:\s*none !important/);
  assert.match(css, /\.cw-next,[\s\S]*background:\s*#16c47f !important/);
  assert.doesNotMatch(css, /inset 3px 0 0|#5ee7c4|#82f4d8/);
});

test("green palette replaces every blue accent across the shipped layers", async () => {
  const layers = await Promise.all(
    [
      "src/widget.css",
      "src/assistant-redesign.css",
      "src/approved-submit-final.css",
      "src/final-user-correction.css",
      "src/mobile-configurator-polish.css",
      "src/configurator-runtime-final.css",
    ].map(read),
  );
  const css = layers.join("\n");

  for (const gone of [
    "#3478f6", "#1f55c9", "#8ab4ff", "#78a9ff",
    "#75b8ff", "#4e8cff", "#2868c8", "#245fae",
  ]) {
    assert.ok(!css.toLowerCase().includes(gone), `Blue ${gone} is back`);
  }
  assert.doesNotMatch(css, /rgba\(\s*52,\s*120,\s*246/);
  assert.doesNotMatch(css, /rgba\(\s*31,\s*85,\s*201/);
  assert.doesNotMatch(css, /rgba\(\s*122,\s*162,\s*220/);

  for (const token of ["#16c47f", "#0fa568", "#7fe0b4"]) {
    assert.ok(css.toLowerCase().includes(token), `Missing green ${token}`);
  }
  assert.match(css, /rgba\(122,\s*210,\s*180/);
});

test("the six reported interaction defects stay fixed", async () => {
  const css = await read("src/final-user-correction.css");

  // (a) nothing shifts position or border width between states
  assert.match(css, /transform:\s*none !important;\s*\n\s*border-style:\s*solid !important;\s*\n\s*border-width:\s*1px !important/);
  // (b) no circular sweep left to half-fill a rectangular button
  assert.match(css, /\)\[class\]::before\s*\{\s*\n\s*content:\s*none !important/);
  // (c) neither the card nor the grid row may pin a height
  assert.match(css, /min-height:\s*0 !important;\s*\n\s*height:\s*auto !important/);
  assert.match(css, /grid-auto-rows:\s*auto !important/);
  // (d) icon left, text right
  assert.match(css, /flex-direction:\s*row !important/);
  // (e) one pill height for primary actions
  assert.match(css, /\.cw-submit,\s*\.cw-next,\s*\.cw-chat-builder\)\[class\]\s*\{[\s\S]*?height:\s*50px !important/);
  // (f) narrow phones may not overflow
  assert.match(css, /@media \(max-width: 430px\)/);

  // shapes and motion agreed with the website
  assert.match(css, /--w-ease:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.match(css, /outline:\s*3px solid rgba\(22,\s*196,\s*127,\s*0\.86\) !important/);
  assert.match(css, /animation-delay:\s*0\.15s !important/);
  assert.match(css, /prefers-reduced-motion/);
});

test("starter chips retire once the conversation begins", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");

  assert.match(conversation, /const conversationStarted = messages\.some\(\(message\) => message\.from === "me"\)/);
  assert.match(conversation, /\{conversationStarted \? null : \(/);
  // the chip carries only its label — no glyph is appended in any state
  assert.match(conversation, /<span className="cw-chip__label">\{label\}<\/span>/);
  assert.doesNotMatch(conversation, /cw-chip__plus|content: "\+"/);
});

test("auto-advance does not leave a parked pointer lighting up the next step", async () => {
  const runtime = await read("src/lib/configuratorAutoAdvance.ts");
  const css = await read("src/final-user-correction.css");

  assert.match(runtime, /widget\.dataset\.pointerParked = "true"/);
  assert.match(runtime, /widget\.addEventListener\("pointermove", release\)/);
  assert.match(runtime, /delete widget\.dataset\.pointerParked/);
  assert.match(css, /\[data-pointer-parked="true"\][\s\S]*?:hover:not\(\[data-selected="true"\]\)/);
});

test("the contact step lines up on one inset without stray rules", async () => {
  const css = await read("src/final-user-correction.css");

  // every block in the step shares the step's own inset
  assert.match(
    css,
    /\.cw-calc-step\[data-step="contact"\]\[class\] :is\(\s*\n\s*\.cw-step-head, \.cw-q, \.cw-contact-stage, \.cw-contact-methods,\s*\n\s*\.cw-lead, \.cw-lead__form, \.cw-summary\s*\n\s*\) \{/,
  );
  // the hairline above and below the optional-details row is gone
  assert.match(css, /\.cw-lead__optional\[class\] \{\s*\n\s*border: 0 !important/);
  // and the summary can scroll clear of the sticky submit bar
  assert.match(css, /padding-bottom: 18px !important/);
});
