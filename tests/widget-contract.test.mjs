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
  const embeddedStyles = await Promise.all(
    [
      "src/widget.css",
      "src/assistant-redesign.css",
      "src/approved-submit-final.css",
      "src/final-user-correction.css",
      "src/green-motion-final.css",
      "src/unified-experience-final.css",
      "src/masterpiece-final.css",
    ].map(read),
  );

  for (const source of [main, embed]) {
    assert.match(source, /widget\.css/);
    assert.match(source, /assistant-redesign\.css/);
    assert.match(source, /approved-submit-final\.css/);
    assert.match(source, /final-user-correction\.css/);
    assert.match(source, /green-motion-final\.css/);
    assert.match(source, /unified-experience-final\.css/);
    assert.match(source, /masterpiece-final\.css/);
    assert.doesNotMatch(source, /installWidgetSpotlight/);
  }
  // The finish layer is the last word, so it has to be imported last.
  for (const source of [main, embed]) {
    const sheets = source.match(/import "\.\/(.*)\.css";/g) ?? [];
    assert.match(sheets[sheets.length - 1], /masterpiece-final\.css/);
  }
  assert.match(main, /preview\.css/);
  assert.doesNotMatch(embed, /preview\.css/);
  assert.equal((main.match(/import "\.\/.*\.css";/g) ?? []).length, 8);
  assert.equal((embed.match(/import "\.\/.*\.css";/g) ?? []).length, 7);

  // The direct widget.js build shares the host document. Foundation resets
  // therefore belong to the widget, never to every host element.
  assert.doesNotMatch(foundation, /^\s*\*,/m);
  assert.doesNotMatch(foundation, /^\s*html,\s*$/m);
  assert.doesNotMatch(foundation, /^\s*body,\s*$/m);
  assert.match(foundation, /\.cw-widget \*,/);
  for (const css of embeddedStyles) {
    assert.doesNotMatch(css, /^\s*:root\b/m);
    assert.doesNotMatch(css, /^\s*(?:html|body|#root|\*)\s*[,\{]/m);
  }

  for (const selector of [
    ".cw-tabs",
    ".cw-rowcard",
    ".cw-inputbar",
    ".cw-next",
    ".cw-submit",
  ]) {
    assert.ok(
      !foundation.includes(selector),
      `${selector} must not be defined in widget.css`,
    );
  }
});

test("assistant order and interactive send feedback remain explicit", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');

  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);
  assert.match(conversation, /Vyskladať riešenie/);
  assert.match(conversation, /Čo mi to ušetrí\?/);
  assert.match(conversation, /Čo mám poslať\?/);
  // no jargon anywhere the visitor can read it
  assert.doesNotMatch(
    conversation,
    /konfigurátor|parametr|špecifik|kvalifikác/i,
  );
  assert.match(conversation, /data-sending=\{sending\}/);
  assert.match(
    conversation,
    /aria-busy=\{typing \|\| activeQuickReply !== null\}/,
  );
  assert.match(conversation, /useLayoutEffect/);
  assert.match(conversation, /bubble\.animate/);
  assert.match(conversation, /getBoundingClientRect/);
  // The chip fill is the confirmation, so the wait has to outlast the sweep.
  assert.match(conversation, /QUICK_REPLY_CONFIRM_MS = 460/);
  assert.match(conversation, /smooth \? "smooth" : "auto"/);
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

  assert.match(widget, /onClick=\{\(\) => clickMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => clickMode\("assistant"\)\}/);
  assert.match(widget, /setPointerCapture/);
  assert.match(widget, /suppressClickRef/);
  assert.match(widget, /data-mode=\{mode\}/);
  assert.doesNotMatch(widget, /cw-tabs__glass/);
  assert.match(css, /Visible widget rebuild/);
  assert.match(css, /grid-template-columns:\s*1fr 1fr !important/);
  assert.match(css, /\.cw-tabs > button\[data-active="true"\]/);
  assert.match(css, /background:\s*#4db6ac !important/);
});

test("the redesign uses only the website black and brand palette", async () => {
  const css = await read("src/assistant-redesign.css");

  // dark base stays dark; the accents are the website's three greens
  for (const token of [
    "#0b0d11",
    "#13161c",
    "#ffc79d",
    "#4db6ac",
    "#7b8fa6",
    "#f5f7fa",
    "#a8bab1",
  ]) {
    assert.ok(
      css.toLowerCase().includes(token),
      `Missing palette token ${token}`,
    );
  }

  // the blues the website moved away from must not come back
  for (const gone of [
    "#3478f6",
    "#1f55c9",
    "#8ab4ff",
    "#16c47f",
    "#0fa568",
    "#7fe0b4",
  ]) {
    assert.ok(
      !css.toLowerCase().includes(gone),
      `Retired accent ${gone} is back in the palette`,
    );
  }

  assert.doesNotMatch(css, /teal|turquoise|bronze|gold/i);
  assert.doesNotMatch(css, /!important/);
});

test("primary actions, quick chips and composer use intentional geometry", async () => {
  const css = await read("src/assistant-redesign.css");

  assert.match(rule(css, ".cw-chat-builder"), /border-radius:\s*999px/);
  assert.match(
    css,
    /\.cw-next,\s*\.cw-submit\s*\{[^}]*border-radius:\s*999px/s,
  );
  assert.match(
    rule(css, ".cw-quick-replies .cw-chip"),
    /border-radius:\s*999px/,
  );
  assert.match(rule(css, ".cw-inputbar"), /border-radius:\s*18px/);
  assert.match(
    rule(css, ".cw-direct-actions__grid a"),
    /border-radius:\s*14px/,
  );
  assert.match(
    css,
    /\.cw-next:active:not\(:disabled\),\s*\.cw-submit:active:not\(:disabled\)\s*\{[^}]*transform:\s*none/s,
  );
});

test("chat chips and composer use a crisp non-liquid system", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/approved-submit-final.css");

  assert.doesNotMatch(conversation, /cw-send__halo/);
  assert.doesNotMatch(conversation, /data-pulse=/);
  assert.match(css, /Unified widget controls/);
  assert.match(css, /\.cw-quick-replies \.cw-chip::before/);
  assert.match(css, /content:\s*none !important/);
  assert.match(css, /\.cw-inputbar/);
  assert.match(css, /background:\s*#0b0e13 !important/);
});

test("calculator choices keep geometry and use one static selected system", async () => {
  const baseCss = await read("src/assistant-redesign.css");
  const finalCss = await read("src/approved-submit-final.css");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const twoColumns = /repeat\(2,\s*minmax\(0,\s*1fr\)\)/;

  assert.match(
    baseCss.match(/\.cw-choice-grid--interest,[\s\S]*?\}/)?.[0] ?? "",
    twoColumns,
  );
  assert.match(rule(baseCss, ".cw-rowcard"), /border-radius:\s*18px/);
  assert.match(finalCss, /background:\s*#222c3b !important/);
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
  assert.match(css, /background:\s*#ffc79d !important/);
  assert.match(css, /data-visible="true"/);
  assert.doesNotMatch(css, /\.cw-selection-indicator::(?:before|after)/);
});

test("icons remain one custom rounded line family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  for (const icon of [
    "attachment",
    "calculator",
    "calendar",
    "chat",
    "inquiry",
    "options",
    "phone",
    "spark",
    "tools",
  ]) {
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
  assert.doesNotMatch(
    motion,
    /animateReceivedMessage|animateSentMessage|animateStepIn/,
  );
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
    assert.ok(
      noPreference.includes(`@keyframes ${name}`),
      `${name} escaped the guard`,
    );
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
    assert.ok(
      noPreference.includes(`animation-delay: ${delay}`),
      `missing stagger ${delay}`,
    );
  }
  // Typing dots are 160ms apart and stop as soon as the reply lands.
  assert.match(noPreference, /animation-delay: 160ms !important/);
  assert.match(noPreference, /animation-delay: 320ms !important/);
});

test("configurator remains five short steps with explicit selection guidance", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  const featureBlock =
    flow.match(/export const FEATURES:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";

  assert.ok(stepsMatch);
  assert.equal(
    (
      stepsMatch[1].match(/"(interest|industry|features|timeline|contact)"/g) ??
      []
    ).length,
    5,
  );
  assert.equal((featureBlock.match(/id:/g) ?? []).length, 8);
  assert.match(flow, /Vyberte jednu vec/);
  assert.match(flow, /Odpovedať zákazníkom/);
  assert.match(flow, /Počítať cenu/);
  assert.match(flow, /Pomáhať s výberom/);
  assert.match(flow, /Neviem, poraďte mi/);

  // Plain language only: none of the words a first-time visitor would trip over.
  assert.doesNotMatch(
    flow,
    /konfigurátor|parametr|špecifik|kvalifikác|rozsah zákazky/i,
  );

  // Every question is one sentence.
  const questions =
    flow.match(/export const QUESTIONS[\s\S]*?\n\};/)?.[0] ?? "";
  assert.ok(questions);
  for (const [, title] of questions.matchAll(/^\s{4}"([^"]+\?)",$/gm)) {
    assert.equal(
      title.replace(/\?$/, "").split(/[.!?]\s/).length,
      1,
      `question is more than one sentence: ${title}`,
    );
  }

  // Capabilities are data; project-price arithmetic is deliberately absent.
  assert.doesNotMatch(flow, /BASE_PRICE|priceOf|price:\s*\d+/);
});

test("approved lead submission keeps sweep feedback and website hierarchy", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/approved-submit-final.css");

  assert.match(calculator, /cw-submit--approved/);
  assert.match(calculator, /data-state=\{sendState\}/);
  assert.match(calculator, /Poslať zadanie/);
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

  assert.match(calculator, /placeholder="Meno \*"/);
  assert.match(calculator, /Váš e-mail/);
  assert.match(calculator, /CONTACT_METHODS/);
  assert.match(calculator, /Osobne/);
  assert.match(calculator, /await sendLead/);
  assert.match(client, /api\/lead/);
  assert.match(client, /AbortController/);
  assert.match(api, /RESEND_API_KEY/);
  assert.match(api, /rate-limit-exceeded/);
});

test("a delivered lead is confirmed to the visitor, and a failed one is not claimed", async () => {
  const api = await read("api/lead.ts");
  const client = await read("src/lib/leadApi.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");

  // The visitor gets their own copy, with the reference they can quote.
  assert.match(api, /async function sendConfirmation/);
  assert.match(api, /to: \[payload\.email\]/);
  assert.match(api, /reply_to: RECIPIENT/);
  assert.match(api, /await sendConfirmation\(payload\)/);
  assert.match(api, /reference: clean\(raw\.reference, 40\)/);
  // Confirming is a courtesy on top of a lead that already arrived, so a
  // failure there may never fail the request the visitor is waiting on.
  assert.match(api, /catch \(error\) \{\s*\n\s*console\.error\("lead-confirmation-failed"/);
  // It also may not fire for someone who never gave an address.
  assert.match(api, /!validEmail\(payload\.email\)\) return;/);

  // The client reports what actually happened instead of always succeeding.
  assert.match(client, /export type LeadResult = \{ delivered: boolean; fallback\?: string \}/);
  assert.match(client, /return \{ delivered: true \}/);
  assert.match(calculator, /setHandedToMailClient\(!result\.delivered\)/);
  assert.match(calculator, /Otvoril som vám rozpísaný e-mail/);
  assert.match(calculator, /reference: nextProposalNumber/);
});

test("the reply streams in and the thread keeps up with it", async () => {
  const api = await read("api/chat.ts");
  const client = await read("src/lib/assistantApi.ts");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  // Server: an event stream when the client asks for one, JSON otherwise.
  assert.match(api, /function wantsStream/);
  assert.match(api, /text\/event-stream/);
  assert.match(api, /res\.flushHeaders\?\.\(\)/);
  // A buffering proxy would defeat the whole point of streaming.
  assert.match(api, /"X-Accel-Buffering", "no"/);
  assert.match(api, /writeEvent\(res, "delta", \{ text \}\)/);
  // Once headers are out a status code is gone, so failures travel as events.
  assert.match(api, /writeEvent\(res, "error"/);
  assert.match(api, /client\.messages\.stream\(request/);

  // Model config: Haiku has no `effort` knob and does not think unless
  // asked, so the request carries neither — sending `effort` errors outright
  // on this model.
  assert.match(api, /const MODEL = "claude-haiku-4-5"/);
  assert.doesNotMatch(api, /thinking:|output_config:|EFFORT/);
  assert.doesNotMatch(api, /temperature|top_p|top_k/);
  assert.match(api, /const MAX_TOKENS = 512/);

  // Client: frames are parsed across chunk boundaries, and the first-byte
  // timeout is released once text is arriving so it cannot cut a live stream.
  assert.match(client, /function parseEventStream/);
  assert.match(client, /buffer \+ decoder\.decode\(value, \{ stream: true \}\)/);
  assert.match(client, /clearTimeoutOnce\(\)/);
  assert.match(client, /onPartial\?: ChatStreamHandler/);
  assert.match(client, /Accept: onPartial \? "text\/event-stream" : "application\/json"/);
  // A server that answers with JSON anyway still works.
  assert.match(client, /!contentType\.includes\("text\/event-stream"\)/);

  // Thread: one bubble that grows, never a second one beside it.
  assert.match(conversation, /const replyId = nextIdRef\.current\+\+/);
  assert.match(
    conversation,
    /sendChat\(\s*\n\s*history,\s*\n\s*controller\.signal,\s*\n\s*paint,\s*\n\s*conversationId\(\),\s*\n\s*\)/,
  );
  assert.match(conversation, /data-streaming=\{message\.streaming \|\| undefined\}/);
});

test("tapping a mode never lands on the drag handler instead of the button", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const startDrag =
    widget.match(/const startThumbDrag[\s\S]*?\n  \};/)?.[0] ?? "";

  assert.ok(startDrag, "startThumbDrag must exist");
  // While an element holds pointer capture the browser retargets `click` to
  // it, so capturing on pointerdown swallowed every tap on the tab buttons.
  assert.doesNotMatch(startDrag, /setPointerCapture/);
  assert.doesNotMatch(startDrag, /dataset\.dragging/);
  // Capture is taken only once the pointer has actually travelled.
  assert.match(widget, /if \(Math\.abs\(clientX - drag\.x\) <= DRAG_THRESHOLD_PX\) return;/);
  assert.match(widget, /drag\.moved = true;\s*\n\s*tabs\.dataset\.dragging = "true";\s*\n\s*tabs\.setPointerCapture\?\.\(pointerId\)/);
});

test("the finish layer removes browser blue and keeps one motion vocabulary", async () => {
  const css = await read("src/masterpiece-final.css");

  // Autofill is the blue that showed up the moment the name field was filled.
  assert.match(css, /-webkit-autofill/);
  // The fallback is the light surface: if the identity token ever went
  // missing, a dark one would paint a black slab over a white form.
  assert.match(css, /box-shadow: 0 0 0 60px var\(--ux-surface, #ffffff\) inset !important/);
  assert.match(css, /transition: background-color 8640000s/);
  assert.match(css, /::selection/);
  assert.match(css, /accent-color: var\(--mp-accent\) !important/);
  assert.match(css, /-webkit-tap-highlight-color: transparent !important/);
  // No cool accent may be introduced here.
  for (const gone of ["#4db6ac", "#7b8fa6", "#3478f6", "#16c47f"]) {
    assert.ok(
      !css.toLowerCase().includes(gone),
      `Retired accent ${gone} is back in the finish layer`,
    );
  }
  // One curve, three durations.
  assert.match(css, /--mp-ease: cubic-bezier\(0\.16, 1, 0\.3, 1\)/);
  for (const token of ["--mp-fast: 160ms", "--mp-base: 280ms", "--mp-slow: 440ms"]) {
    assert.ok(css.includes(token), `Missing duration token ${token}`);
  }
  // Reduced motion stops the decoration without hiding any state.
  const reduced = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*$/,
  )?.[0];
  assert.ok(reduced, "reduce block missing");
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /opacity: 1 !important/);
});

test("the finish layer sizes the builder to its step and glows the contacts", async () => {
  const css = await read("src/masterpiece-final.css");

  // Rows hug their content and follow the question, rather than inflating to
  // fill the panel — a four-option step used to reach 280px per card.
  assert.match(css, /grid-auto-rows: minmax\(72px, auto\) !important/);
  assert.match(css, /align-content: start !important/);
  assert.match(
    css,
    /\.cw-calc-body\[class\]:has\(\.cw-calc-step:not\(\[data-step="contact"\]\)\)/,
  );
  assert.match(css, /-webkit-line-clamp: 3 !important/);
  // The contact step is the one that may scroll, because it holds a form.
  assert.match(
    css,
    /\.cw-calc-body\[class\]:has\(\.cw-calc-step\[data-step="contact"\]\)/,
  );
  // Contact is the only thing carrying light at rest.
  assert.match(css, /--mp-glow-rest:/);
  assert.match(css, /--mp-glow-strong:/);
  assert.match(css, /\.cw-direct-actions__grid\[class\] a \{[\s\S]*?box-shadow: var\(--mp-glow-rest\)/);
  // The chip fills rather than flipping colour.
  assert.match(css, /transform: scaleX\(0\) !important/);
  assert.match(css, /transition: transform 440ms var\(--mp-ease\) !important/);
  assert.match(css, /\[data-sending="true"\]::after \{\s*\n\s*transform: scaleX\(1\)/);
  // The send button is a circle with a real pressed state.
  assert.match(css, /\.cw-send\[class\] \{[\s\S]*?border-radius: 999px !important/);
  assert.match(css, /transform: scale\(0\.9\) !important/);
});

test("the phone keyboard folds away what is not the conversation", async () => {
  const css = await read("src/masterpiece-final.css");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  assert.match(conversation, /const \[composing, setComposing\] = useState\(false\)/);
  assert.match(conversation, /onFocus=\{\(\) => setComposing\(true\)\}/);
  assert.match(conversation, /onBlur=\{\(\) => setComposing\(false\)\}/);
  assert.match(conversation, /data-composing=\{composing \|\| undefined\}/);

  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(
    css,
    /\.cw-conversation\[data-composing\]\[class\] :is\(\.cw-chat-top, \.cw-direct-actions\)/,
  );
  assert.match(css, /:has\(\.cw-conversation\[data-composing\]\) \.cw-tabs\[class\]/);
  // The message stays readable — nothing shrinks to make room.
  assert.match(css, /\.cw-message-wrap\[class\] p \{\s*\n\s*font-size: 15px !important/);
  // Below 16px iOS zooms the page on focus, which is what "it shrank" was.
  assert.match(css, /\.cw-inputbar\[class\] input \{\s*\n\s*font-size: 16px !important/);
});

test("consent sits with the button it gates, not below the fold", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/masterpiece-final.css");

  // It is inside the sticky footer, above the submit button.
  const footer =
    calculator.match(/cw-calc-actions--final[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.ok(footer, "final action bar must exist");
  assert.ok(
    footer.indexOf("cw-consent") < footer.indexOf('data-testid="lead-submit"'),
    "consent must come before the submit button",
  );
  assert.match(footer, /data-checked=\{lead\.consent\}/);
  // ...and no longer duplicated inside the scrolling form.
  assert.equal((calculator.match(/className="cw-consent"/g) ?? []).length, 1);

  // The native box keeps focus and the keyboard; the drawn one is the accent.
  assert.match(css, /\.cw-consent\[class\] input\[type="checkbox"\] \{[\s\S]*?opacity: 0 !important/);
  assert.match(css, /\.cw-consent\[class\]:has\(input:focus-visible\)/);
  assert.match(css, /\.cw-consent\[class\] \{[\s\S]*?min-height: 44px !important/);
  assert.match(css, /\[data-checked="true"\] \.cw-consent__box \{[\s\S]*?background: var\(--mp-accent\)/);
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

  assert.match(flow, /Ako sa vám môžem ozvať\?/);
  assert.match(calculator, /Osobne/);
  assert.match(calculator, /Vaše číslo \*/);
  assert.match(calculator, /cw-contact-methods/);
  assert.match(calculator, /Cez video/);
  // The sticky footer carries the submit button, not a duplicate restart that
  // pushed "Odoslať dopyt" below the fold. Restart stays in the panel header.
  assert.match(
    calculator,
    /cw-calc-actions--final[\s\S]*?data-testid="lead-submit"/,
  );
  assert.doesNotMatch(calculator, /cw-restart/);
  assert.doesNotMatch(calculator, /Dohodnime ďalší krok/);
  assert.match(css, /overflow-y:\s*auto !important/);
  assert.match(css, /scrollbar-gutter:\s*stable !important/);
  assert.match(css, /cw-calc-step\[data-step="contact"\]/);
});

test("messages begin at the top and icon tiles stay transparent", async () => {
  const css = await read("src/approved-submit-final.css");
  const authority = await read("src/unified-experience-final.css");

  assert.match(css, /justify-content:\s*flex-start !important/);
  assert.match(css, /No emoji tile or square plate/);
  assert.match(css, /background:\s*transparent !important/);
  assert.match(css, /cw-rowcard__body b/);
  assert.match(css, /opacity:\s*1 !important/);
  assert.match(authority, /No tile, circle or selected plate/);
  assert.match(
    authority,
    /\.cw-rowcard\[data-selected="true"\] \.cw-rowcard__icon/,
  );
  assert.match(authority, /background:\s*transparent !important/);
  assert.match(authority, /box-shadow:\s*none !important/);
});

test("final user correction centers quick replies and keeps one input shape", async () => {
  const css = await read("src/final-user-correction.css");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

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
  assert.match(
    css,
    /\.cw-inputbar,\s*html body \.cw-widget \.cw-inputbar:focus-within/,
  );
  assert.match(css, /border-radius:\s*15px !important/);
});

test("final configurator correction removes clipping, icon tiles and selected stripes", async () => {
  const css = await read("src/final-user-correction.css");

  assert.match(css, /grid-auto-rows:\s*minmax\(122px, auto\) !important/);
  assert.match(css, /max-height:\s*none !important/);
  assert.match(css, /overflow:\s*visible !important/);
  assert.match(
    css,
    /\.cw-rowcard__icon[\s\S]*background:\s*transparent !important/,
  );
  assert.match(
    css,
    /\.cw-selection-indicator svg[\s\S]*transform:\s*none !important/,
  );
  assert.match(css, /\.cw-next,[\s\S]*background:\s*#ffc79d !important/);
  assert.doesNotMatch(css, /inset 3px 0 0|#5ee7c4|#82f4d8/);
});

test("the final authority exposes only charcoal, warm surfaces and peach interaction", async () => {
  const css = await read("src/unified-experience-final.css");

  for (const token of [
    "#0a0908",
    "#100e0c",
    "#18130f",
    "#201914",
    "#271e18",
    "#ffc79d",
  ]) {
    assert.ok(
      css.toLowerCase().includes(token),
      `Missing final palette colour ${token}`,
    );
  }
  for (const gone of ["#3478f6", "#16c47f", "#4db6ac", "#7b8fa6"]) {
    assert.ok(
      !css.toLowerCase().includes(gone),
      `Retired accent ${gone} is in the final authority`,
    );
  }
  assert.match(css, /--ux-on-peach:\s*#0a0908/);
  assert.match(css, /--mc-brand-hover:\s*var\(--ux-peach\)/);
  assert.match(css, /--w-blue-hover:\s*var\(--ux-peach\)/);
});

test("the six reported interaction defects stay fixed", async () => {
  const css = await read("src/final-user-correction.css");

  // (a) nothing shifts position or border width between states
  assert.match(
    css,
    /transform:\s*none !important;\s*\n\s*border-style:\s*solid !important;\s*\n\s*border-width:\s*1px !important/,
  );
  // (b) no circular sweep left to half-fill a rectangular button
  assert.match(
    css,
    /\)\[class\]::before\s*\{\s*\n\s*content:\s*none !important/,
  );
  // (c) neither the card nor the grid row may pin a height
  assert.match(
    css,
    /min-height:\s*0 !important;\s*\n\s*height:\s*auto !important/,
  );
  assert.match(css, /grid-auto-rows:\s*auto !important/);
  // (d) icon left, text right
  assert.match(css, /flex-direction:\s*row !important/);
  // (e) one pill height for primary actions
  assert.match(
    css,
    /\.cw-submit,\s*\.cw-next,\s*\.cw-chat-builder\)\[class\]\s*\{[\s\S]*?height:\s*50px !important/,
  );
  // (f) narrow phones may not overflow
  assert.match(css, /@media \(max-width: 430px\)/);

  // shapes and motion agreed with the website
  // one curve for the whole product, the website's
  assert.doesNotMatch(css, /cubic-bezier\((?!0\.16, 1, 0\.3, 1\))/);
  assert.match(css, /--w-ease:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
  // the final focus ring uses the only interactive accent
  const brandLayer = await read("src/unified-experience-final.css");
  assert.match(
    brandLayer,
    /outline:\s*3px solid rgba\(255,\s*199,\s*157,\s*0\.88\) !important/,
  );
  assert.match(css, /animation-delay:\s*0\.15s !important/);
  assert.match(css, /prefers-reduced-motion/);
});

test("starter chips retire once the conversation begins", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  assert.match(
    conversation,
    /const conversationStarted = messages\.some\(\(message\) => message\.from === "me"\)/,
  );
  // They also go the moment the visitor starts writing their own question —
  // on a phone those two rows were taking as much height as the thread.
  assert.match(
    conversation,
    /const showQuickReplies =\s*\n\s*!conversationStarted && \(activeQuickReply !== null \|\| input\.trim\(\) === ""\)/,
  );
  assert.match(conversation, /\{showQuickReplies \? \(/);
  // the chip carries only its label — no glyph is appended in any state
  assert.match(
    conversation,
    /<span className="cw-chip__label">\{label\}<\/span>/,
  );
  assert.doesNotMatch(conversation, /cw-chip__plus|content: "\+"/);
});

test("the composer keeps its size at every panel height", async () => {
  const css = await read("src/masterpiece-final.css");
  const mobile =
    css.match(/@media \(max-width: 560px\) \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.ok(mobile, "the phone block must exist");
  // Only the thread is elastic. Every other row is content-sized, so a short
  // panel cannot squeeze the row the visitor is typing into.
  assert.match(
    mobile,
    /grid-template-rows: auto minmax\(0, 1fr\) min-content min-content min-content !important/,
  );
  assert.match(mobile, /\.cw-inputbar\[class\] \{\s*\n\s*height: 54px !important;\s*\n\s*min-height: 54px !important/);
  assert.match(mobile, /\.cw-inputbar\[class\] input \{[\s\S]*?min-height: 42px !important/);
  assert.match(mobile, /\.cw-send\[class\] \{[\s\S]*?min-height: 44px !important/);
});

test("transcripts are logged without ever costing a visitor their answer", async () => {
  const log = await read("api/chatLog.ts");
  const chat = await read("api/chat.ts");
  const client = await read("src/lib/chatHistory.ts");
  const api = await read("src/lib/assistantApi.ts");

  // Logging is opt-in and inert until both Upstash values are present.
  assert.match(log, /export function chatLogEnabled/);
  assert.match(log, /UPSTASH_REDIS_REST_URL && process\.env\.UPSTASH_REDIS_REST_TOKEN/);
  // Ids arrive from the browser, so they may never be pasted into a key.
  assert.match(log, /\^\[A-Za-z0-9_-\]\{8,64\}\$/);
  // Nothing accumulates forever: transcripts expire, turns and index are capped.
  assert.match(log, /const RETENTION_SECONDS = 90 \* 24 \* 60 \* 60/);
  assert.match(log, /\["LTRIM", key, -MAX_TURNS_PER_CONVERSATION, -1\]/);
  assert.match(log, /ZREMRANGEBYRANK/);
  assert.match(log, /\["EXPIRE", key, RETENTION_SECONDS\]/);

  // Written after the answer is out and never awaited.
  assert.match(chat, /const record = \(answer: string\): void =>/);
  assert.match(chat, /void logExchange\(conversationId, question, answer\)/);
  assert.match(chat, /record\(collected\);/);
  assert.match(chat, /record\(reply\);/);

  // The id identifies the conversation, not the person, and reset mints a new one.
  assert.match(client, /export function conversationId\(\): string/);
  assert.match(client, /store\?\.removeItem\(CONVERSATION_KEY\)/);
  assert.match(api, /body: JSON\.stringify\(\{ messages, conversationId \}\)/);
});

test("the transcript viewer is the least permissive thing here", async () => {
  const viewer = await read("api/transcripts.ts");
  const ui = await read("api/historyUi.ts");
  const readme = await read("README.md");

  // One shared secret, compared in constant time, accepted three ways.
  assert.match(viewer, /timingSafeEqual/);
  assert.match(viewer, /createHash\("sha256"\)/);
  assert.match(viewer, /Bearer /);
  // A short secret is refused rather than served weakly.
  assert.match(viewer, /const MIN_TOKEN_LENGTH = 24/);
  assert.match(viewer, /transcripts-token-too-weak/);
  // Proving it once keeps it out of every link and out of the page source.
  assert.match(viewer, /HttpOnly; Secure; SameSite=Strict/);
  assert.doesNotMatch(viewer, /href="\?token=/);
  // Never cached, never indexed, and no CORS header is ever set.
  assert.match(viewer, /"X-Robots-Tag", "noindex, nofollow"/);
  assert.match(viewer, /"Cache-Control", "no-store, max-age=0"/);
  assert.doesNotMatch(viewer, /Access-Control-Allow-Origin/);
  // Visitor text is rendered as text, never as markup.
  assert.match(ui, /export const escapeHtml/);
  assert.match(ui, /escapeHtml\(turn\.text\)/);
  assert.match(ui, /escapeHtml\(item\.preview/);
  // Unset means the endpoint does not answer at all.
  assert.match(viewer, /transcripts-not-configured/);

  assert.match(readme, /UPSTASH_REDIS_REST_URL/);
  assert.match(readme, /CHAT_LOG_TOKEN/);
  assert.match(readme, /90 dňoch/);
});

test("both endpoints share one origin list so it cannot half-apply", async () => {
  const origins = await read("api/origins.ts");
  const chat = await read("api/chat.ts");
  const lead = await read("api/lead.ts");

  // The chat list was missing mojchatbot.sk while the lead list had it, so on
  // the production site every chat request came back 403 and the widget fell
  // back to its offline text — which reads as the bot answering badly.
  for (const domain of [
    "https://danielvendzur-code.github.io",
    "https://moj-chatbot-backend.vercel.app",
    "https://mojchatbot.sk",
    "https://www.mojchatbot.sk",
  ]) {
    assert.ok(origins.includes(domain), `Missing allowed origin ${domain}`);
  }
  assert.match(origins, /ALLOWED_ORIGINS/);

  // Neither handler may keep a list of its own to drift again.
  for (const source of [chat, lead]) {
    assert.match(source, /from "\.\/origins\.js"/);
    assert.match(source, /requestOrigin\(req\.headers\)/);
    assert.doesNotMatch(source, /const DEFAULT_ALLOWED_ORIGINS/);
    assert.doesNotMatch(source, /function allowedOrigin/);
    assert.doesNotMatch(source, /function configuredOrigins/);
  }
});

test("the contact step gives the form room when the keyboard is up", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/masterpiece-final.css");

  // Header, switch and progress took 298px of a 380px panel, leaving 64px of
  // form — the visitor typed their name into a field scrolled out of sight.
  assert.match(calculator, /const \[composing, setComposing\] = useState\(false\)/);
  assert.match(calculator, /data-composing=\{composing \|\| undefined\}/);
  assert.match(calculator, /onFocusCapture=/);
  assert.match(calculator, /onBlurCapture=/);
  // Only a control that summons a keyboard may fold the panel.
  assert.match(calculator, /const isTextField = \(element: HTMLElement\): boolean =>/);
  assert.match(calculator, /element\.type !== "checkbox" && element\.type !== "radio"/);
  // Moving between two fields must not unfold and refold it.
  assert.match(calculator, /if \(!\(next instanceof HTMLElement\) \|\| !isTextField\(next\)\)/);

  assert.match(css, /:has\(\.cw-calculator\[data-composing\]\) :is\(\.cw-tabs, \.cw-progress\)/);
  assert.match(css, /:has\(\.cw-calculator\[data-composing\]\) \.cw-panel-head\[class\]/);
});

test("focus is drawn on the control, not as a rectangle beside it", async () => {
  const css = await read("src/masterpiece-final.css");

  // An offset outline reads as a doubled border on a field and a stray
  // rectangle on a pill button.
  assert.match(css, /:is\(button, a, summary, label\):focus-visible/);
  // A peach ring on a peach button is invisible, so that one goes dark inside.
  assert.match(
    css,
    /:is\(\s*\n\s*\.cw-next,\s*\n\s*\.cw-submit,\s*\n\s*\.cw-chat-builder,\s*\n\s*\.cw-send\s*\n\s*\)\[class\]:focus-visible \{\s*\n\s*outline: none !important/,
  );
  // A text field announces focus with its own border and glow.
  assert.match(css, /:is\(input, textarea\):focus \{\s*\n\s*outline: none !important/);
});

test("the conversation survives a reload and reset clears it", async () => {
  const history = await read("src/lib/chatHistory.ts");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  // Blocked storage must never break the widget, only cost it the history.
  assert.match(history, /function storage\(\): Storage \| null/);
  assert.match(history, /probe\.setItem\(key, "1"\)/);
  // A thread nobody replied to is the greeting, not a conversation.
  assert.match(history, /if \(!messages\.some\(\(message\) => message\.from === "me"\)\) return null/);
  assert.match(history, /MAX_AGE_MS/);
  assert.match(history, /MAX_TURNS/);
  // Ids must continue past what was restored or React reuses the wrong node.
  assert.match(history, /const highest = messages\.reduce/);

  assert.match(conversation, /const restored = useRef\(loadHistory\(\)\)\.current/);
  assert.match(conversation, /const nextIdRef = useRef\(restored\?\.nextId \?\? 2\)/);
  // Saved once the reply has settled, not once per streamed token.
  assert.match(conversation, /if \(streamingReply \|\| typing\) return;\s*\n\s*saveHistory/);
  // An effect also runs on mount; ungated it wiped the thread it had just
  // restored, which is why history never survived a reload.
  assert.match(conversation, /if \(resetTokenRef\.current === resetToken\) return;/);
  assert.match(conversation, /clearHistory\(\);/);
});

test("an accepted lead is traceable and one bad mailbox cannot sink the other", async () => {
  const api = await read("api/lead.ts");

  // Resend answering 200 means accepted, not delivered. The message id is the
  // only handle on what happened next, and it was being discarded.
  assert.match(api, /async function resendMessageId/);
  assert.match(api, /typeof body\.id === "string" \? body\.id : ""/);
  assert.match(api, /return \{ ok: true, ids: \[`\$\{recipient\}=\$\{id \|\| "accepted"\}`\] \}/);
  assert.match(api, /console\.log\(\s*\n\s*"lead-accepted"/);
  assert.match(api, /res\.status\(200\)\.json\(\{ ok: true, autoReplySent, ids \}\)/);

  // One message per recipient. On a shared envelope a single refusing mailbox
  // takes the whole message down, losing the lead from every inbox at once.
  assert.match(api, /LEAD_RECIPIENTS\.map\(async \(recipient\): Promise<Delivery>/);
  assert.match(api, /to: \[recipient\]/);
  assert.doesNotMatch(api, /to: LEAD_RECIPIENTS/);
  // Accepted anywhere is still a delivered lead; the refusal is logged beside it.
  assert.match(api, /console\.error\("lead-recipient-refused", refusals\.join\(" \| "\)\)/);
  assert.match(api, /if \(results\.some\(\(result\) => result\.ok\)\) return \{ ok: true, ids \}/);
});

test("a refused delivery channel no longer hides the reason or skips the next one", async () => {
  const api = await read("api/lead.ts");
  const client = await read("src/lib/leadApi.ts");
  const readme = await read("README.md");

  // Resend names the cause in the body; only the status used to survive.
  assert.match(api, /async function resendFailure/);
  assert.match(api, /`resend-\$\{response\.status\}\$\{detail \? ` \$\{detail\}` : ""\}`/);
  // The shared sender only delivers to the account's own address — the single
  // most common reason a correctly-keyed enquiry never arrives.
  assert.match(api, /const SHARED_SENDER = "Môj Chatbot <onboarding@resend\.dev>"/);
  assert.match(api, /only delivers to the Resend account's own address/);
  assert.match(api, /is verified at resend\.com\/domains/);
  // A refusal is carried, not thrown, so it cannot skip the channels after it.
  assert.match(
    api,
    /type Delivery = \{ ok: boolean; skipped\?: boolean; reason\?: string; ids\?: string\[\] \}/,
  );
  assert.match(api, /attempts\.push\(\["webhook", await deliverWithWebhook\(subject, text\)\]\)/);
  assert.match(api, /console\.error\("lead-delivery-failed", failures\.join\(" \| "\)\)/);
  // Nothing configured and something refusing are different problems.
  assert.match(api, /error: "delivery-not-configured"/);
  assert.match(api, /reason: failures\.join\(" \| "\)/);
  // The key is never part of what travels back.
  assert.doesNotMatch(api, /reason:.*RESEND_API_KEY|RESEND_API_KEY.*reason:/);

  assert.match(client, /if \(data\.reason\) console\.warn\("lead-delivery-failed", data\.reason\)/);
  // ...and the env the owner has to set is written down.
  assert.match(readme, /LEAD_FROM_EMAIL/);
  assert.match(readme, /onboarding@resend\.dev/);
});

test("info@mojchatbot.sk is the address, the personal one is the second contact", async () => {
  const api = await read("api/lead.ts");
  const client = await read("src/lib/leadApi.ts");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const fallbackReplies = await read("src/lib/assistantApi.ts");
  const readme = await read("README.md");

  // Sender and primary recipient.
  assert.match(api, /const SENDER = process\.env\.LEAD_FROM_EMAIL \|\| "Môj Chatbot <info@mojchatbot\.sk>"/);
  assert.match(api, /const RECIPIENT = process\.env\.LEAD_TO_EMAIL \|\| "info@mojchatbot\.sk"/);

  // The personal address is kept on the thread, so a lead is never sitting in
  // one inbox alone — and it is de-duplicated if both point at the same box.
  assert.match(api, /const SECOND_CONTACT =/);
  assert.match(api, /"daniel@vendzur\.sk"/);
  assert.match(api, /const LEAD_RECIPIENTS = \[RECIPIENT, SECOND_CONTACT\]/);
  assert.match(api, /all\.indexOf\(address\) === index/);
  // Addressed one message each, so a refusing mailbox cannot take the other
  // recipient's copy down with it.
  assert.match(api, /LEAD_RECIPIENTS\.map\(async \(recipient\)/);
  assert.match(api, /to: \[recipient\]/);

  // Everything the visitor can see or click.
  assert.match(conversation, /mailto:info@mojchatbot\.sk/);
  assert.match(fallbackReplies, /Napíšte na info@mojchatbot\.sk/);
  assert.match(client, /const FALLBACK_RECIPIENT = "info@mojchatbot\.sk"/);
  assert.match(readme, /LEAD_CC_EMAIL/);

  // No visitor-facing surface still shows the personal address.
  for (const source of [conversation, fallbackReplies, client]) {
    assert.doesNotMatch(source, /daniel@vendzur\.sk/);
  }
});

test("auto-advance does not leave a parked pointer lighting up the next step", async () => {
  const runtime = await read("src/lib/configuratorAutoAdvance.ts");
  const css = await read("src/final-user-correction.css");

  assert.match(runtime, /widget\.dataset\.pointerParked = "true"/);
  assert.match(runtime, /widget\.addEventListener\("pointermove", release\)/);
  assert.match(runtime, /delete widget\.dataset\.pointerParked/);
  assert.match(
    css,
    /\[data-pointer-parked="true"\][\s\S]*?:hover:not\(\[data-selected="true"\]\)/,
  );
});

test("the contact step lines up on one inset without stray rules", async () => {
  const css = await read("src/final-user-correction.css");

  // every block in the step shares the step's own inset
  assert.match(
    css,
    /\.cw-calc-step\[data-step="contact"\]\[class\] :is\(\s*\n\s*\.cw-step-head, \.cw-q, \.cw-contact-stage, \.cw-contact-methods,\s*\n\s*\.cw-lead, \.cw-lead__form, \.cw-summary\s*\n\s*\) \{/,
  );
  // the hairline above and below the optional-details row is gone
  assert.match(
    css,
    /\.cw-lead__optional\[class\] \{\s*\n\s*border: 0 !important/,
  );
  // and the summary can scroll clear of the sticky submit bar
  assert.match(css, /padding-bottom: 18px !important/);
});

test("a new step never arrives with a chip that looks chosen", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const motionCss = await read("src/green-motion-final.css");

  // (a) React must not recycle a DOM node — and its :hover/:focus state —
  // between two steps that render the same option index.
  const keys =
    calculator.match(/key=\{`\$\{stepId\}-\$\{(?:option|method)\.id\}`\}/g) ??
    [];
  assert.equal(keys.length, 5, "every option grid needs a step-scoped key");
  assert.doesNotMatch(calculator, /key=\{option\.id\}/);
  assert.doesNotMatch(calculator, /key=\{method\.id\}/);

  // (b) nothing is selected on the visitor's behalf
  assert.match(calculator, /useState<string\[\]>\(\[\]\)/);
  assert.match(calculator, /contactMethod: null/);
  assert.match(calculator, /contactMethod: ContactMethod \| null/);
  assert.doesNotMatch(flow, /export const defaultFeatures/);
  assert.doesNotMatch(calculator, /defaultFeatures/);

  // (c) focus follows the question instead of falling through to <body>
  assert.match(
    calculator,
    /questionRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
  );
  assert.match(
    calculator,
    /className="cw-q" ref=\{questionRef\} tabIndex=\{-1\}/,
  );
  assert.doesNotMatch(calculator, /active\.blur\(\)/);

  // (d) hover may not borrow the selection colour, and a parked pointer gets
  // no hover styling at all
  assert.match(motionCss, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(motionCss, /@media not all and \(hover: hover\)/);
  assert.match(motionCss, /\[data-pointer-parked="true"\]\[class\]/);
  assert.match(
    motionCss,
    /:focus:not\(:focus-visible\) \{\s*\n\s*outline: none/,
  );

  // (e) no decoration singles one option out
  assert.doesNotMatch(calculator, /cw-opt__tag/);
});

test("project estimates are absent while customer-price capability remains", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const prompt = await read("api/chat.ts");
  const fallback = await read("src/lib/assistantApi.ts");
  const page = await read("index.html");

  for (const source of [calculator, flow, prompt, fallback, page]) {
    assert.doesNotMatch(
      source,
      /350\s*€|BASE_PRICE|priceOf|price-estimate|summary-price/,
    );
  }
  assert.doesNotMatch(calculator, /Odhad ceny|dostať cenu|presnou cenou/);
  assert.doesNotMatch(prompt, /začína od|350\s*€/i);
  assert.match(prompt, /Cenu projektu neodhaduj/);
  assert.match(flow, /label:\s*"Spočíta cenu"/);
  assert.match(flow, /description:\s*"Podľa rozmerov alebo množstva\."/);
});

test("the step swap holds the panel height so nothing jumps", async () => {
  const hook = await read("src/hooks/useStepTransition.ts");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const motionCss = await read("src/unified-experience-final.css");

  assert.match(hook, /container\.style\.minHeight = /);
  assert.match(hook, /container\.style\.minHeight = ""/);
  assert.match(hook, /STEP_EXIT_MS = 72/);
  assert.match(hook, /STEP_ENTER_MS = 640/);
  assert.match(hook, /direction:\s*"forward" \| "backward"/);
  // reduced motion swaps instantly and locks no height
  assert.match(
    hook,
    /if \(prefersReducedMotion\(\)\) \{\s*\n\s*setVisibleStep\(step\);/,
  );

  assert.match(calculator, /useStepTransition\(step, bodyRef\)/);
  assert.match(calculator, /data-leaving=\{leaving \|\| undefined\}/);
  assert.match(calculator, /data-direction=\{direction\}/);
  assert.match(motionCss, /ux-step-forward-in 400ms/);
  assert.match(motionCss, /ux-step-backward-in 400ms/);
  assert.match(motionCss, /ux-step-forward-out 72ms/);
});

test("the progress label reads as a sentence and has room for it", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const flow = await read("src/lib/assistantFlow.ts");
  const motionCss = await read("src/green-motion-final.css");

  assert.match(flow, /export const QUESTION_STEPS/);
  assert.match(
    calculator,
    /Otázka \$\{questionIndex \+ 1\} zo \$\{QUESTION_STEPS\.length\}/,
  );
  assert.match(calculator, /"Posledný krok"/);
  // the row was a grid with a 34px last column, which simply clipped the label
  assert.match(
    motionCss,
    /grid-template-columns: auto minmax\(24px, 1fr\) auto !important/,
  );
  assert.match(
    motionCss,
    /transition: width 520ms var\(--cw-ease\) !important/,
  );
});

test("mobile keeps its scrolling and its pinch-zoom", async () => {
  const foundation = await read("src/widget.css");
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const redesign = await read("src/assistant-redesign.css");
  const motionCss = await read("src/green-motion-final.css");

  // html/body must never become the scroll container
  assert.doesNotMatch(
    foundation,
    /html\[data-embed="true"\] body \{[^}]*overflow: hidden/s,
  );
  assert.match(foundation, /overflow-x: clip/);
  assert.doesNotMatch(widget, /document\.body\.style\.overflow = "hidden"/);
  assert.match(redesign, /overflow-x: clip/);

  // touch-action: manipulation belongs on controls, never on a scroll area
  assert.match(
    motionCss,
    /html body \.cw-widget button,\s*\n[^{]*\{\s*\n\s*touch-action: manipulation/,
  );
  assert.doesNotMatch(
    motionCss,
    /\.cw-panel[^{]*\{[^}]*touch-action: manipulation/s,
  );
  assert.doesNotMatch(
    motionCss,
    /\.cw-messages[^{]*\{[^}]*touch-action: manipulation/s,
  );
  assert.doesNotMatch(
    motionCss,
    /\.cw-calc-body[^{]*\{[^}]*touch-action: manipulation/s,
  );

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
  assert.match(
    motionCss,
    /\.cw-launcher\[class\] \{\s*\n\s*animation: none !important/,
  );
  assert.match(
    motionCss,
    /\[data-selected="true"\]::before \{\s*\n\s*animation: none !important/,
  );
  // and the 2% scale nudge on pick is gone
  assert.match(
    motionCss,
    /\[data-selected="true"\] \{\s*\n\s*animation: none !important;\s*\n\s*transform: none !important/,
  );

  // the only endless animations left are bounded progress indicators
  const infinite = [
    ...correction.matchAll(/animation:\s*([\w-]+)[^;]*infinite/g),
  ].map((m) => m[1]);
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
  assert.match(
    motionCss,
    /\.cw-calculator\[data-view="thanks"\] \{\s*\n\s*display: block !important/,
  );
  assert.match(
    motionCss,
    /\.cw-thanks__actions\[class\] button svg \{[^}]*width: 16px/s,
  );
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

  for (const entry of [main, embed])
    assert.match(entry, /installPremiumTilt\(\)/);

  // rotation only — a hover lift the selected state does not match is what
  // made the chips look like they jumped when clicked. Strip comments first so
  // the prose explaining that rule does not trip the check.
  const tiltCode = tilt.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  assert.doesNotMatch(tiltCode, /translate|top:|margin/);
  assert.match(tilt, /--cw-tilt-x/);
  assert.match(tilt, /--cw-tilt-y/);
  assert.match(css, /rotateX\(var\(--cw-tilt-x, 0deg\)\)/);
  assert.match(css, /rotateY\(var\(--cw-tilt-y, 0deg\)\)/);
  assert.doesNotMatch(
    css.match(/\[data-tilting="true"\]:not\(:disabled\) \{[\s\S]*?\}/)?.[0] ??
      "",
    /translate/,
  );

  // never on touch, never under reduced motion, and inert unless installed
  assert.match(tilt, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(tilt, /prefers-reduced-motion: reduce/);
  assert.match(css, /html\[data-cw-premium-tilt="true"\]/);

  // The direct build shares its document with the host page. Pointer work is
  // therefore widget-scoped, frame-batched and fully disposable.
  assert.match(tilt, /\.cw-widget :is\(\.cw-chip/);
  assert.match(tilt, /requestAnimationFrame\(paint\)/);
  assert.match(tilt, /cancelAnimationFrame\(frame\)/);
  assert.match(tilt, /addEventListener\("pointerout", onPointerOut/);
  assert.match(tilt, /current\.contains\(related\)/);
  assert.doesNotMatch(tilt, /addEventListener\("pointerleave"/);
  assert.match(tilt, /removeEventListener\("pointermove", onPointerMove\)/);
  assert.match(tilt, /window\.addEventListener\("pagehide", cleanup/);
  assert.match(tilt, /return cleanup/);
});

test("the iframe follows the mobile visual viewport above the software keyboard", async () => {
  const loader = await read("public/embed.js");

  for (const property of ["top", "left", "width", "height"]) {
    assert.ok(
      loader.includes(`--site-assistant-vv-${property}`),
      `Missing visual viewport ${property}`,
    );
  }
  assert.match(loader, /var visualViewport = window\.visualViewport/);
  assert.match(loader, /visualViewport\.offsetTop/);
  assert.match(loader, /visualViewport\.offsetLeft/);
  assert.match(loader, /visualViewport\.width/);
  assert.match(loader, /visualViewport\.height/);
  assert.match(
    loader,
    /requestAnimationFrame\(function \(\) \{\s*\n\s*visualViewportFrame = 0;\s*\n\s*syncVisualViewport\(\)/,
  );
  assert.match(
    loader,
    /visualViewport\.addEventListener\("resize", scheduleVisualViewportSync/,
  );
  assert.match(
    loader,
    /visualViewport\.addEventListener\("scroll", scheduleVisualViewportSync/,
  );
  assert.match(
    loader,
    /visualViewport\.removeEventListener\(\s*"resize",\s*scheduleVisualViewportSync,?\s*\)/,
  );
  assert.match(
    loader,
    /visualViewport\.removeEventListener\(\s*"scroll",\s*scheduleVisualViewportSync,?\s*\)/,
  );
  assert.match(
    loader,
    /frame\.classList\.toggle\("is-open", open\);\s*\n\s*syncVisualViewport\(\)/,
  );
  assert.match(loader, /height:var\(--site-assistant-vv-height,100dvh\)/);
});

test("the closed iframe canvas stays transparent around the circular launcher", async () => {
  const loader = await read("public/embed.js");
  const css = await read("src/widget.css");
  assert.match(loader, /allowtransparency="true"/);
  assert.match(css, /html\[data-embed="true"\][\s\S]*color-scheme:\s*normal/);
  assert.match(css, /background:\s*transparent !important/);
});

test("the iframe returns focus to the page control that opened it", async () => {
  const loader = await read("public/embed.js");

  assert.match(loader, /var returnFocusElement = null/);
  assert.match(loader, /if \(!open && !pendingOpen\) rememberReturnFocus\(\)/);
  assert.match(
    loader,
    /var wasOpen = open;\s*\n\s*applyOpenState\(data\.open === true\);/,
  );
  assert.match(
    loader,
    /if \(wasOpen && data\.open !== true\) restoreReturnFocusAfterExit\(\)/,
  );
  assert.match(loader, /candidate\.focus\(\{ preventScroll: true \}\)/);
  assert.match(loader, /candidate\.getClientRects\(\)\.length === 0/);
  assert.match(loader, /FOCUS_RESTORE_MS = 320/);
  assert.match(
    loader,
    /cancelFocusRestore\(\);\s*\n\s*returnFocusElement = null;/,
  );
});

test("options reveal one after another rather than as a block", async () => {
  const css = await read("src/unified-experience-final.css");

  assert.match(css, /animation: ux-option-in 400ms var\(--ux-ease\) backwards/);
  for (const delay of ["20ms", "60ms", "100ms", "140ms", "180ms", "220ms"]) {
    assert.ok(
      css.includes(`animation-delay: ${delay}`),
      `Missing stagger step ${delay}`,
    );
  }
  assert.match(css, /@keyframes ux-option-in/);
  const optionStart = css.indexOf("@keyframes ux-option-in");
  const nextKeyframes = css.indexOf("@keyframes", optionStart + 1);
  const optionAnimation = css.slice(optionStart, nextKeyframes);
  assert.doesNotMatch(optionAnimation, /filter:\s*blur/);
});

test("mode transitions preserve work and close only after the exit motion", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/unified-experience-final.css");

  assert.match(widget, /data-state=\{isClosing \? "closing" : "open"\}/);
  assert.match(widget, /PANEL_EXIT_MS = 210/);
  assert.match(widget, /data-view="calculator"[\s\S]*?<ToolCalculator/);
  assert.match(widget, /data-view="assistant"[\s\S]*?<AssistantConversation/);
  assert.doesNotMatch(widget, /className="cw-panel-body" key=\{mode\}/);
  assert.match(widget, /toggleAttribute\("inert", mode !== "calculator"\)/);
  assert.match(css, /ux-panel-close 210ms/);
  assert.match(css, /\.cw-mode-view\[data-active="true"\]/);
});

test("close and reopen retain mode, chat draft, history and calculator progress", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/unified-experience-final.css");

  // The panel mounts lazily once, then stays mounted. Closing only applies
  // `hidden` after the exit timer, so every child hook keeps its identity.
  assert.match(widget, /const \[hasOpened, setHasOpened\] = useState\(false\)/);
  assert.match(widget, /setHasOpened\(true\)/);
  assert.match(widget, /\{hasOpened \? \(\s*<section[\s\S]*?hidden=\{!isOpen\}/);
  assert.doesNotMatch(widget, /\{isOpen \? \(\s*<section/);
  assert.match(
    css,
    /\.cw-panel\[class\]\[hidden\] \{\s*\n\s*display: none !important/,
  );
  assert.match(
    widget,
    /panelRef\.current\?\.toggleAttribute\("inert", isClosing \|\| !isOpen\)/,
  );

  // Launcher resume keeps the current mode and preset. Only the visible reset
  // button may advance resetToken; ordinary open/close cannot erase work.
  assert.match(widget, /onClick=\{\(\) => open\(mode, preset\)\}/);
  const openHandler = widget.slice(
    widget.indexOf("const open = useCallback"),
    widget.indexOf("const switchMode = useCallback"),
  );
  assert.doesNotMatch(openHandler, /setResetToken/);
  assert.equal((widget.match(/setResetToken\(/g) ?? []).length, 1);
  const resetButton =
    widget.match(/data-testid="widget-reset"[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.ok(resetButton, "explicit reset button must exist");
  assert.match(resetButton, /setPreset\(null\)/);
  assert.match(
    resetButton,
    /setResetToken\(\(value\) => value \+ 1\)/,
  );

  // Programmatic opens still select the requested route/preset instead of
  // accidentally using the launcher's resume behavior.
  assert.match(
    widget,
    /window\.addEventListener\(SITE_ASSISTANT_OPEN_EVENT, onOpen\)/,
  );
  assert.match(widget, /openFromOptions\(options \?\? \{ entry: "builder" \}\)/);
  assert.match(
    widget,
    /installEmbedBridge\(\{ open: openFromOptions, close \}\)/,
  );

  // These local states now live for the full widget session because their
  // owning components are descendants of the persistent panel.
  // The thread now starts from storage when there is one to restore, so the
  // greeting is the fallback rather than the only possible starting state.
  assert.match(
    conversation,
    /restored\?\.messages\.length \? restored\.messages : INITIAL_MESSAGES/,
  );
  assert.match(conversation, /const \[input, setInput\] = useState\(""\)/);
  assert.match(conversation, /value=\{input\}/);
  assert.match(conversation, /onChange=\{\(event\) => setInput\(event\.target\.value\)\}/);
  assert.match(widget, /data-view="assistant"[\s\S]*?<AssistantConversation/);
  assert.match(widget, /data-view="calculator"[\s\S]*?<ToolCalculator/);
  assert.match(calculator, /const \[step, setStep\] = useState\(0\)/);
  assert.match(
    calculator,
    /const \[lead, setLead\] = useState<LeadState>\(EMPTY_LEAD\)/,
  );
});

test("close button and Escape both restore focus to the launcher", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const focusTrap = await read("src/hooks/useFocusTrap.ts");

  const closeButton =
    widget.match(/data-testid="widget-close"[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.ok(closeButton, "close button must exist");
  assert.match(closeButton, /onClick=\{close\}/);

  // Escape and the X share one close path, including normal and reduced-motion
  // exits. The post-commit layout effect focuses the still-mounted launcher.
  assert.match(focusTrap, /if \(event\.key === "Escape"\)[\s\S]*?onEscape\(\)/);
  assert.match(
    widget,
    /useFocusTrap\(panelRef, isOpen && !isClosing, close, launcherRef\)/,
  );
  assert.match(
    widget,
    /if \(reducedMotion\(\)\) \{\s*\n\s*finish\(\);\s*\n\s*return;/,
  );
  assert.match(widget, /window\.setTimeout\(finish, PANEL_EXIT_MS\)/);
  assert.match(
    widget,
    /restoreLauncherFocusRef\.current = true;\s*\n\s*setIsOpen\(false\)/,
  );
  assert.match(
    widget,
    /if \(isOpen \|\| !restoreLauncherFocusRef\.current\) return;[\s\S]*?launcherRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
  );

  // The focus-trap cleanup can no longer race the close effect back to body or
  // another stale element: the explicit launcher ref always wins.
  assert.match(
    focusTrap,
    /\(returnFocusRef\?\.current \?\? previous\)\?\.focus\(\{ preventScroll: true \}\)/,
  );
});

test("chat reset aborts stale work and same-tick sends are locked synchronously", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const api = await read("src/lib/assistantApi.ts");

  assert.match(conversation, /const inFlightRef = useRef\(false\)/);
  assert.match(conversation, /if \(inFlightRef\.current\) return/);
  assert.match(conversation, /requestEpochRef\.current \+= 1/);
  assert.match(conversation, /requestAbortRef\.current\?\.abort\(\)/);
  assert.match(conversation, /requestEpoch !== requestEpochRef\.current/);
  assert.match(
    conversation,
    /inputRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
  );
  assert.match(api, /requestSignal\?: AbortSignal/);
  assert.match(api, /requestSignal\?\.addEventListener\("abort"/);
});

test("the summary card keeps its text off its own border", async () => {
  const motion = await read("src/green-motion-final.css");
  const correction = await read("src/final-user-correction.css");

  assert.match(
    motion,
    /\.cw-summary\[class\] \{\s*\n\s*padding: 14px 16px !important/,
  );
  assert.match(motion, /overflow-wrap: anywhere !important/);
  // the alignment rule zeroes padding on the layout wrappers only; the summary
  // is a bordered card and keeps its own inset
  const paddingRule = correction.match(
    /:is\(\s*\n\s*\.cw-step-head, \.cw-q, \.cw-contact-stage, \.cw-contact-methods,\s*\n\s*\.cw-lead, \.cw-lead__form\s*\n\s*\) \{\s*\n\s*padding-left: 0/,
  );
  assert.ok(
    paddingRule,
    "summary must be excluded from the padding-zeroing rule",
  );
});

test("nothing plus-shaped renders anywhere near the quick replies", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const motion = await read("src/green-motion-final.css");

  // The builder keeps its spark and its original label.
  const builder =
    conversation.match(
      /<button[^>]*className="cw-chat-builder"[\s\S]*?<\/button>/,
    )?.[0] ?? "";
  assert.ok(builder, "chat builder button must exist");
  assert.match(builder, /WidgetIcon name="spark"/);
  assert.match(builder, /Vyskladať riešenie/);

  // A chip renders its label and nothing else: no glyph on either
  // pseudo-element, and no other child may draw a badge beside the text.
  assert.match(
    motion,
    /\.cw-quick-replies\[class\] \.cw-chip\[class\]::before \{\s*\n\s*content: none !important/,
  );
  assert.match(
    motion,
    /\.cw-quick-replies\[class\] \.cw-chip\[class\]::after \{[\s\S]*?content: "" !important/,
  );
  assert.match(
    motion,
    /\.cw-chip\[class\] > \*:not\(\.cw-chip__label\) \{\s*\n\s*display: none !important/,
  );
  const chipMarkup =
    conversation.match(/className="cw-chip"[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.ok(chipMarkup, "chip markup must exist");
  assert.doesNotMatch(chipMarkup, /WidgetIcon|__icon|__badge/);

  // no stylesheet in the tree carries a plus glyph, imported or not
  const sheets = await Promise.all(
    [
      "src/competition-winner-final.css",
      "src/final-user-correction.css",
      "src/green-motion-final.css",
      "src/approved-submit-final.css",
      "src/assistant-redesign.css",
    ].map(read),
  );
  for (const sheet of sheets) assert.doesNotMatch(sheet, /content:\s*"\+"/);
});
