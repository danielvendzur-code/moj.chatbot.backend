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
    assert.match(source, /green-motion-final\.css/);
    assert.doesNotMatch(source, /installWidgetSpotlight/);
    assert.equal((source.match(/import "\.\/.*\.css";/g) ?? []).length, 5);
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
  assert.match(conversation, /Spočítať cenu za štyri otázky/);
  assert.match(conversation, /Čo mi to ušetrí\?/);
  assert.match(conversation, /Čo mám poslať\?/);
  // no jargon anywhere the visitor can read it
  assert.doesNotMatch(conversation, /konfigurátor|parametr|špecifik|kvalifikác/i);
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
  for (const token of ["#0b110f", "#131c18", "#16c47f", "#0fa568", "#7fe0b4", "#f4f8f6", "#a8bab1"]) {
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
  assert.match(css, /background:\s*#0b1310 !important/);
});

test("calculator choices keep geometry and use one static selected system", async () => {
  const baseCss = await read("src/assistant-redesign.css");
  const finalCss = await read("src/approved-submit-final.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const twoColumns = /repeat\(2,\s*minmax\(0,\s*1fr\)\)/;

  assert.match(baseCss.match(/\.cw-choice-grid--interest,[\s\S]*?\}/)?.[0] ?? "", twoColumns);
  assert.match(rule(baseCss, ".cw-rowcard"), /border-radius:\s*18px/);
  assert.match(finalCss, /background:\s*#223b2f !important/);
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
  const motionCss = await read("src/green-motion-final.css");

  // Entrances are CSS now, so they cannot run at all under reduced motion.
  assert.match(motion, /prefersReducedMotion/);
  assert.match(motion, /drawCheck/);
  assert.doesNotMatch(motion, /animateReceivedMessage|animateSentMessage|animateStepIn/);
  assert.match(css, /prefers-reduced-motion/);

  // Every keyframed entrance sits inside the no-preference block.
  const noPreference = motionCss.match(
    /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(noPreference, "no-preference block missing");
  for (const name of [
    "cw-chip-in",
    "cw-step-in",
    "cw-step-out",
    "cw-msg-in-left",
    "cw-msg-in-right",
    "cw-typing-dot",
  ]) {
    assert.ok(noPreference.includes(`@keyframes ${name}`), `${name} escaped the guard`);
  }

  // Reduced motion may not hide content: nothing is left transparent.
  const reduced = motionCss.match(
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}\n\n/,
  )?.[0];
  assert.ok(reduced, "reduce block missing");
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /opacity: 1/);

  // The staggered chip entrance uses the website curve and the brief's timings.
  assert.match(motionCss, /--cw-ease:\s*cubic-bezier\(0\.16, 1, 0\.3, 1\)/);
  for (const delay of ["40ms", "90ms", "140ms", "190ms", "240ms", "290ms"]) {
    assert.ok(noPreference.includes(`animation-delay: ${delay}`), `missing stagger ${delay}`);
  }
  // Typing dots are 160ms apart and stop as soon as the reply lands.
  assert.match(noPreference, /animation-delay: 160ms !important/);
  assert.match(noPreference, /animation-delay: 320ms !important/);
});

test("configurator remains five short steps with explicit selection guidance", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock = flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";

  assert.ok(stepsMatch);
  assert.equal((stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ?? []).length, 5);
  assert.equal((featureBlock.match(/id:/g) ?? []).length, 6);
  assert.match(flow, /Vyberte jednu vec/);
  assert.match(flow, /Odpovedať zákazníkom/);
  assert.match(flow, /Počítať cenu/);
  assert.match(flow, /Pomáhať s výberom/);
  assert.match(flow, /Neviem, poraďte mi/);

  // Plain language only: none of the words a first-time visitor would trip over.
  assert.doesNotMatch(flow, /konfigurátor|parametr|špecifik|kvalifikác|rozsah zákazky/i);

  // Every question is one sentence.
  const questions = flow.match(/export const QUESTIONS[\s\S]*?\n\};/)?.[0] ?? "";
  assert.ok(questions);
  for (const [, title] of questions.matchAll(/^\s{4}"([^"]+\?)",$/gm)) {
    assert.equal(
      title.replace(/\?$/, "").split(/[.!?]\s/).length,
      1,
      `question is more than one sentence: ${title}`,
    );
  }

  // The estimate is data, not a hardcoded string in the view.
  assert.match(flow, /export const BASE_PRICE = \d+/);
  assert.match(flow, /export const priceOf/);
});

test("approved lead submission keeps sweep feedback and website hierarchy", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/approved-submit-final.css");

  assert.match(calculator, /cw-submit--approved/);
  assert.match(calculator, /data-state=\{sendState\}/);
  assert.match(calculator, /Poslať a dostať cenu/);
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

  assert.match(calculator, /Ako sa menujete\? \*/);
  assert.match(calculator, /Váš e-mail/);
  assert.match(calculator, /CONTACT_METHODS/);
  assert.match(calculator, /Osobne/);
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

  assert.match(flow, /Kam vám mám poslať cenu\?/);
  assert.match(calculator, /Osobne/);
  assert.match(calculator, /Vaše číslo \*/);
  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /Cez video/);
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

  for (const label of [
    "Čo mi to ušetrí?",
    "Ako to funguje?",
    "Čo mám poslať?",
    "Ukážte mi príklad",
  ]) {
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
  // one curve for the whole product, the website's
  assert.doesNotMatch(css, /cubic-bezier\((?!0\.16, 1, 0\.3, 1\))/);
  assert.match(css, /--w-ease:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
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

test("a new step never arrives with a chip that looks chosen", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const motionCss = await read("src/green-motion-final.css");

  // (a) React must not recycle a DOM node — and its :hover/:focus state —
  // between two steps that render the same option index.
  const keys = calculator.match(/key=\{`\$\{stepId\}-\$\{(?:option|method)\.id\}`\}/g) ?? [];
  assert.equal(keys.length, 5, "every option grid needs a step-scoped key");
  assert.doesNotMatch(calculator, /key=\{option\.id\}/);
  assert.doesNotMatch(calculator, /key=\{method\.id\}/);

  // (b) nothing is selected on the visitor's behalf
  assert.match(calculator, /useState<string\[\]>\(\[\]\)/);
  assert.match(calculator, /contactMethod: null/);
  assert.match(calculator, /contactMethod: ContactMethod \| null/);
  assert.doesNotMatch(flow, /export const defaultFeatures/);
  assert.doesNotMatch(calculator, /defaultFeatures/);

  // (c) focus is released when the step changes
  assert.match(calculator, /active\.closest\("\.cw-calc-step"\)\) active\.blur\(\)/);

  // (d) hover may not borrow the selection colour, and a parked pointer gets
  // no hover styling at all
  assert.match(motionCss, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(motionCss, /@media not all and \(hover: hover\)/);
  assert.match(motionCss, /\[data-pointer-parked="true"\]\[class\]/);
  assert.match(motionCss, /:focus:not\(:focus-visible\) \{\s*\n\s*outline: none/);

  // (e) no decoration singles one option out
  assert.doesNotMatch(calculator, /cw-opt__tag/);
});

test("the estimate is animated but never absent", async () => {
  const hook = await read("src/hooks/useCountUp.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");

  assert.match(hook, /prefersReducedMotion\(\) \? value : 0/);
  assert.match(hook, /const DURATION = 900/);
  assert.match(hook, /requestAnimationFrame/);
  // reduced motion short-circuits to the real number before any frame runs
  assert.match(hook, /if \(prefersReducedMotion\(\)\) \{\s*\n\s*setShown\(value\);\s*\n\s*return;/);
  // and an interrupted count still lands on the true value
  assert.match(hook, /if \(shownRef\.current !== value\) setShown\(value\)/);

  assert.match(calculator, /useCountUp\(price\)/);
  assert.match(calculator, /data-testid="price-number"/);
});

test("the step swap holds the panel height so nothing jumps", async () => {
  const hook = await read("src/hooks/useStepTransition.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const motionCss = await read("src/green-motion-final.css");

  assert.match(hook, /container\.style\.minHeight = /);
  assert.match(hook, /container\.style\.minHeight = ""/);
  assert.match(hook, /STEP_EXIT_MS = 180/);
  // reduced motion swaps instantly and locks no height
  assert.match(hook, /if \(prefersReducedMotion\(\)\) \{\s*\n\s*setVisibleStep\(step\);/);

  assert.match(calculator, /useStepTransition\(step, bodyRef\)/);
  assert.match(calculator, /data-leaving=\{leaving \|\| undefined\}/);
  assert.match(motionCss, /translateY\(-6px\)/);
});

test("the progress label reads as a sentence and has room for it", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const motionCss = await read("src/green-motion-final.css");

  assert.match(flow, /export const QUESTION_STEPS/);
  assert.match(calculator, /Otázka \$\{questionIndex \+ 1\} zo \$\{QUESTION_STEPS\.length\}/);
  assert.match(calculator, /"Posledný krok"/);
  // the row was a grid with a 34px last column, which simply clipped the label
  assert.match(motionCss, /grid-template-columns: auto minmax\(24px, 1fr\) auto !important/);
  assert.match(motionCss, /transition: width 520ms var\(--cw-ease\) !important/);
});

test("mobile keeps its scrolling and its pinch-zoom", async () => {
  const foundation = await read("src/widget.css");
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const redesign = await read("src/assistant-redesign.css");
  const motionCss = await read("src/green-motion-final.css");

  // html/body must never become the scroll container
  assert.doesNotMatch(foundation, /html\[data-embed="true"\] body \{[^}]*overflow: hidden/s);
  assert.match(foundation, /overflow-x: clip/);
  assert.doesNotMatch(widget, /document\.body\.style\.overflow = "hidden"/);
  assert.match(redesign, /overflow-x: clip/);

  // touch-action: manipulation belongs on controls, never on a scroll area
  assert.match(motionCss, /html body \.cw-widget button,\s*\n[^{]*\{\s*\n\s*touch-action: manipulation/);
  assert.doesNotMatch(motionCss, /\.cw-panel[^{]*\{[^}]*touch-action: manipulation/s);
  assert.doesNotMatch(motionCss, /\.cw-messages[^{]*\{[^}]*touch-action: manipulation/s);
  assert.doesNotMatch(motionCss, /\.cw-calc-body[^{]*\{[^}]*touch-action: manipulation/s);

  // and every control has a 44px target
  assert.match(motionCss, /--cw-tap: 44px/);
  assert.match(motionCss, /min-height: var\(--cw-tap\) !important/);
});

test("nothing pulses forever and nothing moves when you point at it", async () => {
  const motionCss = await read("src/green-motion-final.css");
  const correction = await read("src/final-user-correction.css");

  // the launcher's endless glow and the selected chip's orbiting border are
  // deleted at the source, not merely overridden
  assert.doesNotMatch(correction, /w-idle|w-orbit/);
  assert.match(motionCss, /\.cw-launcher\[class\] \{\s*\n\s*animation: none !important/);
  assert.match(motionCss, /\[data-selected="true"\]::before \{\s*\n\s*animation: none !important/);
  // and the 2% scale nudge on pick is gone
  assert.match(motionCss, /\[data-selected="true"\] \{\s*\n\s*animation: none !important;\s*\n\s*transform: none !important/);

  // the only endless animations left are bounded progress indicators
  const infinite = [...correction.matchAll(/animation:\s*([\w-]+)[^;]*infinite/g)].map((m) => m[1]);
  for (const name of infinite) {
    assert.ok(
      ["w-dot", "cw-typing-wave"].includes(name),
      `${name} loops forever without being a progress indicator`,
    );
  }
});

test("icons cannot balloon and the thank-you screen is not squeezed into a grid row", async () => {
  const foundation = await read("src/widget.css");
  const icons = await read("src/components/widget/WidgetIcon.tsx");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const motionCss = await read("src/green-motion-final.css");

  // WidgetIcon has no width/height attributes, so a default belongs in the
  // foundation layer where every later rule can still override it.
  assert.doesNotMatch(icons, /<svg[^>]*\swidth=/s);
  assert.match(foundation, /\.cw-widget svg \{[^}]*width: 18px/s);

  assert.match(calculator, /data-view="thanks"/);
  assert.match(calculator, /data-view="steps"/);
  assert.match(motionCss, /\.cw-calculator\[data-view="thanks"\] \{\s*\n\s*display: block !important/);
  assert.match(motionCss, /\.cw-thanks__actions\[class\] button svg \{[^}]*width: 16px/s);
});

test("no jargon reaches the screen", async () => {
  const sources = await Promise.all([
    read("src/lib/assistantFlow.ts"),
    read("src/components/widget/ToolCalculator.tsx"),
    read("src/components/widget/AssistantConversation.tsx"),
    read("src/components/widget/AssistantWidget.tsx"),
  ]);

  for (const source of sources) {
    for (const word of [
      "konfigurátor",
      "konfigurácia",
      "parametre",
      "parametrov",
      "špecifikuj",
      "špecifikácia",
      "kvalifikácia",
      "rozsah zákazky",
      "logika",
    ]) {
      assert.ok(
        !source.toLowerCase().includes(word),
        `"${word}" is jargon and must not reach the screen`,
      );
    }
  }
});

test("chips and cards lean toward the cursor without ever moving their box", async () => {
  const tilt = await read("src/lib/premiumTilt.ts");
  const css = await read("src/green-motion-final.css");
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");

  for (const entry of [main, embed]) assert.match(entry, /installPremiumTilt\(\)/);

  // rotation only — a hover lift the selected state does not match is what
  // made the chips look like they jumped when clicked. Strip comments first so
  // the prose explaining that rule does not trip the check.
  const tiltCode = tilt.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  assert.doesNotMatch(tiltCode, /translate|top:|margin/);
  assert.match(tilt, /--cw-tilt-x/);
  assert.match(tilt, /--cw-tilt-y/);
  assert.match(css, /rotateX\(var\(--cw-tilt-x, 0deg\)\)/);
  assert.match(css, /rotateY\(var\(--cw-tilt-y, 0deg\)\)/);
  assert.doesNotMatch(css.match(/\[data-tilting="true"\]:not\(:disabled\) \{[\s\S]*?\}/)?.[0] ?? "", /translate/);

  // never on touch, never under reduced motion, and inert unless installed
  assert.match(tilt, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(tilt, /prefers-reduced-motion: reduce/);
  assert.match(css, /html\[data-cw-premium-tilt="true"\]/);
});

test("options reveal one after another rather than as a block", async () => {
  const css = await read("src/green-motion-final.css");

  assert.match(css, /animation: cw-chip-rise 620ms var\(--cw-ease\) backwards/);
  // 85ms apart, so the order is actually readable
  for (const delay of ["60ms", "145ms", "230ms", "315ms", "400ms", "485ms"]) {
    assert.ok(css.includes(`animation-delay: ${delay}`), `Missing stagger step ${delay}`);
  }
  assert.match(css, /@keyframes cw-chip-rise[\s\S]*?filter: blur\(3px\)/);
});

test("the summary card keeps its text off its own border", async () => {
  const motion = await read("src/green-motion-final.css");
  const correction = await read("src/final-user-correction.css");

  assert.match(motion, /\.cw-summary\[class\] \{\s*\n\s*padding: 14px 16px !important/);
  assert.match(motion, /overflow-wrap: anywhere !important/);
  // the alignment rule zeroes padding on the layout wrappers only; the summary
  // is a bordered card and keeps its own inset
  const paddingRule = correction.match(
    /:is\(\s*\n\s*\.cw-step-head, \.cw-q, \.cw-contact-stage, \.cw-contact-methods,\s*\n\s*\.cw-lead, \.cw-lead__form\s*\n\s*\) \{\s*\n\s*padding-left: 0/,
  );
  assert.ok(paddingRule, "summary must be excluded from the padding-zeroing rule");
});

test("nothing plus-shaped renders anywhere near the quick replies", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const motion = await read("src/green-motion-final.css");

  // The four-pointed spark sat on the CTA directly above the chips and read as
  // a "+" at the size it rendered. The button is label-only now.
  const builder = conversation.match(/<button[^>]*className="cw-chat-builder"[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.ok(builder, "chat builder button must exist");
  assert.doesNotMatch(builder, /WidgetIcon|cw-chat-builder__icon/);

  // and no layer may put a character on a chip pseudo-element
  assert.match(motion, /\.cw-quick-replies\[class\] \.cw-chip\[class\]::before \{\s*\n\s*content: none !important/);
  assert.match(motion, /\.cw-quick-replies\[class\] \.cw-chip\[class\]::after \{[\s\S]*?content: "" !important/);

  // no stylesheet in the tree carries a plus glyph, imported or not
  const sheets = await Promise.all(
    ["src/competition-winner-final.css", "src/final-user-correction.css", "src/green-motion-final.css",
     "src/approved-submit-final.css", "src/assistant-redesign.css"].map(read),
  );
  for (const sheet of sheets) assert.doesNotMatch(sheet, /content:\s*"\+"/);
});
