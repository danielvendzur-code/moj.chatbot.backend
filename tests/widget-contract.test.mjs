import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("demo and embed load the ordered static widget styles", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");

  assert.match(main, /preview\.css/);
  assert.match(main, /widget\.css/);
  assert.match(main, /product-widget\.css/);
  assert.match(main, /widget-polish\.css/);
  assert.equal((main.match(/import "\.\/.*\.css";/g) ?? []).length, 4);

  assert.doesNotMatch(embed, /preview\.css/);
  assert.match(embed, /widget\.css/);
  assert.match(embed, /product-widget\.css/);
  assert.match(embed, /widget-polish\.css/);
  assert.equal((embed.match(/import "\.\/.*\.css";/g) ?? []).length, 3);

  for (const source of [main, embed]) {
    assert.doesNotMatch(source, /assistant-redesign|masterpiece-final|approved-submit/);
    assert.doesNotMatch(
      source,
      /installLimeWhiteStyles|installPremiumTilt|installProductRefinement/,
    );
  }
  assert.doesNotMatch(autoAdvance, /import\s+["'].*\.css/);
});

test("mode switch is the website's sliding segmented control", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/product-widget.css");

  assert.match(widget, /role="tablist"/);
  assert.match(widget, /role="tab"/);
  assert.match(widget, /aria-selected=\{mode === "assistant"\}/);
  assert.match(widget, /aria-selected=\{mode === "calculator"\}/);
  assert.match(widget, />Chatbot</);
  assert.match(widget, />Konfigurátor</);
  assert.doesNotMatch(widget, /resetSpinning|pulseReset|RESET_SPIN_MS/);

  // The thumb and the swipe are the point: this control has to behave like
  // "Bez chatbota / S chatbotom" on the site, not like two flat buttons.
  assert.match(widget, /className="cw-tabs__thumb"/);
  assert.match(widget, /SWIPE_THRESHOLD_PX = 26/);
  assert.match(widget, /onPointerDown/);
  assert.match(widget, /onPointerCancel/);

  assert.match(rule(css, ".cw-tabs"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-tabs"), /background:\s*var\(--cw-mint\)/);
  assert.match(rule(css, ".cw-tabs"), /touch-action:\s*pan-y/);
  assert.match(rule(css, ".cw-tabs__thumb"), /width:\s*calc\(50% - 4px\)/);
  assert.match(
    rule(css, ".cw-tabs__thumb"),
    /transition:\s*transform 420ms var\(--cw-ease\)/,
  );
  assert.match(
    rule(css, '.cw-tabs[data-mode="calculator"] .cw-tabs__thumb'),
    /transform:\s*translateX\(100%\)/,
  );
});

test("brand mark is the website drawing, green and motionless", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  // Same canvas, same two strokes, same 7-unit weight as BrandMark on the
  // site. A redrawn approximation is exactly what this replaced.
  assert.match(logo, /viewBox="0 0 112 112"/);
  assert.match(logo, /className="bl__outer"/);
  assert.match(logo, /className="bl__inner"/);
  assert.match(logo, /stroke="currentColor"/);
  assert.match(logo, /strokeWidth="7"/);
  assert.match(logo, /fill="none"/);
  assert.match(logo, /M28\.6 65\.1V32\.9L53\.4 57\.5/);
  assert.match(logo, /L33\.5 104\.5L57\.5 81\.1H80\.9/);
  assert.doesNotMatch(logo, /<img|data:image|base64|stroke="white"/);

  assert.match(
    rule(polish, ".cw-widget .cw-launcher,\n.cw-widget .cw-panel-head__mascot,\n.cw-widget .cw-avatar"),
    /color:\s*var\(--cw-green\)/,
  );
  assert.match(
    css,
    /\.cw-launcher:hover,[\s\S]*?\.cw-launcher:focus-visible\s*\{[\s\S]*?transform:\s*none;/,
  );
  assert.doesNotMatch(css, /\.bl[^}]*animation:/s);
});

test("launcher is a translucent bubble with a hover preview", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/product-widget.css");
  const launcher = rule(css, ".cw-launcher");

  assert.match(widget, /className="cw-launcher-preview"/);
  assert.match(widget, /Vyskladajte si asistenta na počkanie/);

  assert.match(launcher, /border-radius:\s*50%/);
  assert.match(launcher, /background:\s*var\(--cw-glass-bg\)/);
  assert.match(launcher, /backdrop-filter:\s*var\(--cw-glass-blur\)/);
  // 0.38 is what makes it glass; at 0.72 the bubble just looked white.
  assert.match(css, /--cw-glass-bg:\s*rgba\(255, 255, 255, 0\.38\)/);
  assert.match(launcher, /color:\s*var\(--cw-green\)/);
  // A blurred bubble with no fallback turns into a grey disc where
  // backdrop-filter is unsupported.
  assert.match(css, /@supports not \(\(backdrop-filter[\s\S]*?background:\s*var\(--cw-white\)/);
  assert.match(
    rule(css, ".cw-launcher:hover,\n.cw-launcher:focus-visible"),
    /color:\s*var\(--cw-green-hover\)/,
  );
  assert.match(css, /\.cw-launcher-dock:has\(/);
  assert.match(rule(css, ".cw-launcher-preview"), /opacity:\s*0/);
});

test("panel proportions and hierarchy are deliberate", async () => {
  const css = await read("src/product-widget.css");
  const panel = rule(css, ".cw-panel");

  assert.match(panel, /width:\s*min\(432px,/);
  assert.match(panel, /height:\s*min\(724px,/);
  assert.match(panel, /border-radius:\s*var\(--cw-r-panel\)/);
  assert.match(panel, /box-shadow:/);
  assert.match(rule(css, ".cw-panel-head__title h2"), /font-size:\s*18px/);
});

test("header states availability instead of carrying a tagline", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  const css = await read("src/product-widget.css");

  assert.match(widget, /Môj Chatbot/);
  assert.match(widget, /className="cw-panel-head__online"/);
  assert.match(widget, />\s*Online\s*</);
  assert.doesNotMatch(widget, /Poradca a konfigurátor/);
  assert.match(rule(css, ".cw-panel-head__online"), /color:\s*var\(--cw-green\)/);
  // Nothing about the dot may change size. A growing box-shadow spread smeared
  // it across a half pixel and a scaling ring pseudo-element scaled its own
  // border, leaving the dot sitting in a thick pale donut — both read as
  // "badly cropped". Only opacity is allowed to move.
  const dot = rule(css, ".cw-panel-head__online i");
  assert.match(dot, /width:\s*8px/);
  assert.match(dot, /box-shadow:\s*0 0 0 3px/);
  assert.doesNotMatch(css, /@keyframes cw-online-ring/);
  const breathe = css.match(/@keyframes cw-online-breathe\s*\{[\s\S]*?\n\}/)[0];
  assert.doesNotMatch(breathe, /transform|box-shadow|scale/);
  // Whole-number line boxes keep the dot off half pixels.
  assert.match(rule(css, ".cw-panel-head__title h2"), /line-height:\s*20px/);
  assert.match(rule(css, ".cw-panel-head__online"), /line-height:\s*16px/);
  assert.match(rule(css, ".cw-panel-head__title"), /gap:\s*4px/);
});

test("chat hierarchy is readable and selected chip text stays present", async () => {
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  const top = conversation.indexOf('className="cw-chat-top"');
  const messages = conversation.indexOf('className="cw-messages"');
  const chips = conversation.indexOf('className="cw-quick-replies"');
  const input = conversation.indexOf('className="cw-inputbar"');
  const contacts = conversation.indexOf('className="cw-direct-actions"');
  assert.ok(top > -1 && top < messages);
  assert.ok(messages < chips && chips < input && input < contacts);

  assert.match(conversation, /4 otázky · návrh máte do minúty/);
  assert.match(conversation, /QUICK_REPLY_HOLD_MS = 360/);
  assert.match(conversation, /activeQuickReply !== null/);
  assert.match(conversation, /className="cw-chip__label"/);
  assert.match(conversation, /aria-pressed=\{sending\}/);
  assert.match(conversation, /data-started=\{conversationStarted/);
  assert.match(conversation, /Radšej priamo\?/);
  assert.match(conversation, /disabled=\{!input\.trim\(\) \|\| typing/);
  assert.doesNotMatch(conversation, /flightOrigin|bubble\.animate|translate3d|getBoundingClientRect/);
  assert.match(css, /\.cw-message-wrap p \{[^}]*font-size:\s*14px/);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /font-size:\s*12\.5px/);
  // Full width, one per row: side by side the questions wrapped and the odd
  // one out stretched across the bottom.
  assert.doesNotMatch(rule(css, ".cw-quick-replies"), /grid-template-columns/);
  assert.match(
    rule(css, ".cw-quick-replies .cw-chip:hover,\n.cw-quick-replies .cw-chip:focus-visible"),
    /background:\s*var\(--cw-green-hover\)/,
  );
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /visibility:\s*visible/);
  assert.match(rule(polish, ".cw-widget .cw-chip__label"), /opacity:\s*1/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /opacity:\s*1/);
  assert.match(rule(css, ".cw-inputbar > .cw-send"), /visibility:\s*visible/);
  assert.match(rule(css, ".cw-inputbar > .cw-send:disabled"), /opacity:\s*1/);
});

test("direct contact reads as three reachable chips", async () => {
  const css = await read("src/product-widget.css");
  const grid = rule(css, ".cw-direct-actions__grid");
  const links = rule(css, ".cw-direct-actions__grid a");

  // As borderless text these blended into the panel and nobody pressed them.
  assert.match(grid, /grid-template-columns:\s*repeat\(3,/);
  assert.match(links, /border:\s*1px solid rgba\(25, 131, 79, 0\.22\)/);
  assert.match(links, /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(links, /background:\s*var\(--cw-white\)/);
  assert.match(links, /min-height:\s*42px/);
  assert.match(
    rule(css, ".cw-direct-actions__grid a:hover,\n.cw-direct-actions__grid a:focus-visible"),
    /background:\s*var\(--cw-mint\)/,
  );
});

test("configurator keeps the selected label readable before auto-advance", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const autoAdvance = await read("src/lib/configuratorAutoAdvance.ts");
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(calculator, /function SelectionIndicator/);
  assert.match(calculator, /className="cw-selection-indicator"/);
  assert.match(autoAdvance, /CONFIRM_MS = 320/);
  assert.match(autoAdvance, /next\.click\(\)/);
  assert.match(css, /data-confirming="true"/);
  assert.match(css, /\.cw-selection-indicator\[data-visible="true"\]/);
  assert.match(css, /@keyframes cw-tick-pop/);
  assert.match(polish, /Keep the selected answer readable/);
  assert.match(polish, /visibility:\s*visible/);
  assert.doesNotMatch(css, /--cw-tilt|rotateX|rotateY/);
  assert.match(
    polish,
    /\.cw-rowcard,[\s\S]*?\[data-selected="true"\][\s\S]*?background:\s*var\(--cw-mint\)/,
  );
});

test("steps travel in the direction the visitor is going", async () => {
  const css = await read("src/product-widget.css");

  assert.match(css, /@keyframes cw-step-in\b/);
  assert.match(css, /@keyframes cw-step-in-back/);
  assert.match(css, /@keyframes cw-step-out-back/);
  assert.match(css, /\[data-direction="backward"\]/);
  // A sideways slide inside a vertically scrolling body would otherwise offer
  // a horizontal scrollbar for the length of every transition.
  assert.match(rule(css, ".cw-calc-body"), /overflow-x:\s*clip/);
});

test("progress and contact step expose clear state and labels", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.match(calculator, /cw-progress__dots/);
  assert.match(calculator, /Krok \$\{visibleStep \+ 1\} z \$\{STEPS\.length\}/);
  assert.match(calculator, /className="cw-field"/);
  assert.match(calculator, /aria-invalid=\{nameInvalid\}/);
  assert.match(calculator, /aria-invalid=\{emailInvalid\}/);
  assert.match(calculator, /aria-invalid=\{phoneInvalid\}/);
  assert.match(calculator, /<details className="cw-summary">/);
  assert.match(calculator, /Poslať nezáväzný dopyt/);
  assert.doesNotMatch(calculator, /label: "Osobne"/);
  assert.match(rule(css, ".cw-progress__dots"), /grid-template-columns:\s*repeat\(5,/);
});

test("every control rounds to the shared website scale", async () => {
  const css = await read("src/product-widget.css");

  assert.match(rule(css, ".cw-panel"), /border-radius:\s*var\(--cw-r-panel\)/);
  assert.match(rule(css, ".cw-chat-builder"), /border-radius:\s*var\(--cw-r-panel\)/);
  assert.match(rule(css, ".cw-next"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-submit"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-quick-replies .cw-chip"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-inputbar"), /border-radius:\s*var\(--cw-r-pill\)/);
  // Answers are capsules now, the same shape as the Pokračovať button. These
  // selectors also end a shared base rule, so scan every block that declares
  // them rather than only the first match.
  for (const answer of [".cw-rowcard", ".cw-scard", ".cw-opt", ".cw-vcard"]) {
    const blocks = css.match(
      new RegExp(`\\${answer}\\s*\\{[^}]*\\}`, "g"),
    );
    assert.ok(
      blocks?.some((block) => /border-radius:\s*var\(--cw-r-pill\)/.test(block)),
      `${answer} is not a capsule`,
    );
  }
  assert.match(rule(css, ".cw-field :is(input, textarea)"), /border-radius:\s*var\(--cw-r-pill\)/);
  // Multi-line boxes stay on the card radius — a capsule bows their sides.
  assert.match(rule(css, ".cw-field textarea"), /border-radius:\s*var\(--cw-r-card\)/);
  assert.match(rule(css, ".cw-custom textarea"), /border-radius:\s*var\(--cw-r-card\)/);

  // The scale itself: pills, one card radius, one panel radius. Stray values
  // are what made the widget look assembled from three different products.
  const strays = css
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.startsWith("border-radius:") &&
        !line.includes("var(--cw-r-") &&
        !line.includes("50%") &&
        !line.includes("border-radius: 0;"),
    );
  assert.deepEqual(strays, ["border-radius: 2px;", "border-radius: 6px;"]);
});

test("the widget always sets in the brand typeface", async () => {
  const css = await read("src/product-widget.css");
  const embed = await read("src/embed.tsx");
  const index = await read("index.html");

  // index.html downloaded Inter Tight while the stack asked for Aptos first,
  // so the brand face was fetched and then thrown away.
  assert.match(css, /--cw-font-stack:\s*\n?\s*"Inter Tight"/);
  assert.doesNotMatch(css, /"Aptos"/);
  assert.doesNotMatch(css, /var\(--cw-font,/);
  assert.match(index, /family=Inter\+Tight/);

  // An embedded widget has to bring the face with it, and must no longer
  // inherit whatever the host page happens to use.
  assert.match(embed, /family=Inter\+Tight/);
  assert.match(embed, /ensureBrandFont/);
  assert.doesNotMatch(embed, /setProperty\("--cw-font"/);
});

test("options arrive one after another when a question opens", async () => {
  const css = await read("src/product-widget.css");
  const polish = await read("src/widget-polish.css");

  assert.match(css, /@keyframes cw-option-in/);
  // The delays must sit behind the same prefix as the `animation` shorthand.
  // The shorthand resets animation-delay to 0s, and on a higher-specificity
  // selector it wiped every stagger — the options all arrived at once.
  const prefix = String.raw`\.cw-calc-step:not\(\[data-leaving="true"\]\) \.cw-choice-grid > \*`;
  assert.match(css, new RegExp(`${prefix}:nth-child\\(1\\)[^}]*animation-delay:\\s*70ms`));
  assert.match(css, new RegExp(`${prefix}:nth-child\\(n \\+ 8\\)`));
  assert.match(css, new RegExp(`${prefix}\\s*\\{[^}]*animation:\\s*cw-option-in`));
  // Only opacity and transform move, so the step never changes height.
  const keyframe = css.match(/@keyframes cw-option-in\s*\{[\s\S]*?\n\}/)[0];
  assert.doesNotMatch(keyframe, /height|margin|padding/);
  // A shortened delay still trickles, so the stagger is removed outright.
  assert.match(polish, /\.cw-widget \.cw-choice-grid > \*\s*\{\s*animation:\s*none/);
});

test("chat motion follows the sub-300ms guidance and moves, not blinks", async () => {
  const css = await read("src/product-widget.css");

  assert.match(rule(css, ".cw-message-row"), /animation:\s*cw-message-in 240ms/);
  assert.match(rule(css, ".cw-message-row--me"), /animation-name:\s*cw-message-in-me/);
  assert.match(css, /@keyframes cw-bubble-settle/);
  // A settle that re-ran on every streamed token would judder the bubble.
  assert.match(
    rule(css, '.cw-message-row[data-streaming="true"] .cw-message-wrap p'),
    /animation:\s*none/,
  );
  // Typing dots bounce; a fade reads as loading rather than composing.
  assert.match(css, /@keyframes cw-typing\s*\{[\s\S]*?translateY\(-4px\)/);
  assert.match(
    rule(css, ".cw-inputbar > .cw-send:active:not(:disabled)"),
    /transform:\s*scale\(0\.92\)/,
  );
});

test("a scrollable area says so and offers to move you on", async () => {
  const hook = await read("src/hooks/useScrollCue.ts");
  const cue = await read("src/components/widget/ScrollCue.tsx");
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );
  const css = await read("src/product-widget.css");

  // React swaps the step and message nodes outright, so a ResizeObserver bound
  // to the children present at mount goes stale and the cue never reappears.
  assert.match(hook, /MutationObserver/);
  assert.match(hook, /childList:\s*true/);
  assert.match(hook, /subtree:\s*true/);
  assert.match(hook, /ResizeObserver/);
  assert.match(hook, /scrollBy/);
  assert.match(hook, /prefers-reduced-motion/);

  assert.match(cue, /data-testid="scroll-cue"/);
  assert.match(cue, /cw-scroll-fade/);
  assert.match(cue, /if \(!hasMore\) return null/);

  // The cue lives beside the scroller, not inside it, or it scrolls away from
  // the content it points at.
  for (const source of [calculator, conversation]) {
    assert.match(source, /className="cw-scroll-shell"/);
    assert.match(source, /<ScrollCue targetRef=/);
  }
  assert.match(rule(css, ".cw-scroll-shell"), /position:\s*relative/);
  assert.match(rule(css, ".cw-scroll-cue"), /position:\s*absolute/);
});

test("picking an industry no longer opens an explanation panel", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const css = await read("src/product-widget.css");

  assert.doesNotMatch(calculator, /cw-industry-tip|industry-tip|selectedIndustry/);
  assert.doesNotMatch(calculator, /Čo sa tu najviac oplatí/);
  assert.doesNotMatch(css, /cw-industry-tip/);
});

test("answers fill the width instead of sitting in half-empty columns", async () => {
  const css = await read("src/product-widget.css");

  // Two columns wrapped labels like "Reštaurácia a ubytovanie" onto two
  // cramped lines and left the other half of the step empty.
  assert.doesNotMatch(
    css,
    /\.cw-choice-grid--industry[\s\S]{0,120}grid-template-columns/,
  );
  assert.match(rule(css, ".cw-scard b"), /white-space:\s*nowrap/);
  assert.match(rule(css, ".cw-scard b"), /text-overflow:\s*ellipsis/);
});

test("the builder card and launcher share one glass recipe", async () => {
  const css = await read("src/product-widget.css");
  const builder = rule(css, ".cw-chat-builder");

  assert.match(css, /--cw-glass-blur:\s*blur\(26px\) saturate\(180%\)/);
  assert.match(css, /--cw-glass-rim:/);
  assert.match(builder, /backdrop-filter:\s*var\(--cw-glass-blur\)/);
  assert.match(builder, /var\(--cw-glass-rim\)/);
  assert.match(css, /@keyframes cw-sheen/);
  // The muddy lime radial is what this replaced.
  assert.doesNotMatch(builder, /radial-gradient/);
});

test("palette stays within the website white forest lime identity", async () => {
  const css = (await read("src/product-widget.css")).toLowerCase();

  for (const token of [
    "#ffffff",
    "#f5f9f2",
    "#edf6e7",
    "#b9ed4d",
    "#d9ff78",
    "#19834f",
    "#0f6a3e",
    "#0b2f20",
    "#132019",
    "#536159",
  ]) {
    assert.ok(css.includes(token), `Missing product token ${token}`);
  }

  for (const retired of [
    "#ffc79d",
    "#e58a5b",
    "#4db6ac",
    "#3478f6",
    "#1f55c9",
  ]) {
    assert.ok(!css.includes(retired), `Retired accent ${retired} returned`);
  }
});

test("mobile, keyboard and reduced-motion fallbacks are first-class", async () => {
  const css = await read("src/product-widget.css");
  const conversation = await read(
    "src/components/widget/AssistantConversation.tsx",
  );

  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /width:\s*100dvw/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /animation-duration:\s*1ms/);
  assert.match(css, /data-composing="true"/);
  assert.match(css, /contain:\s*paint/);
  assert.match(conversation, /canAutoFocus/);
  assert.match(conversation, /pointer: fine/);
});

test("icons remain one custom rounded line family", async () => {
  const icons = await read("src/components/widget/WidgetIcon.tsx");

  assert.match(icons, /strokeWidth="1\.85"/);
  assert.match(icons, /strokeLinecap="round"/);
  assert.match(icons, /strokeLinejoin="round"/);
  for (const icon of [
    "calculator",
    "chat",
    "phone",
    "mail",
    "spark",
    "reset",
    "send",
  ]) {
    assert.ok(icons.includes(`"${icon}"`), `Missing icon ${icon}`);
  }
});

test("configurator remains a short five-step conversion flow", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const match = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(match, "STEPS definition missing");
  const steps = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  assert.deepEqual(steps, [
    "interest",
    "industry",
    "features",
    "timeline",
    "contact",
  ]);
});
