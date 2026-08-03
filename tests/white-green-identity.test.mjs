import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const forbiddenWarm =
  /#ffc79d|#f0a873|#f3a75a|#e58a5b|#f4c9a8|#ffe38a|255\s*,\s*199\s*,\s*157|240\s*,\s*168\s*,\s*115/i;
const bubblePath =
  "M26.6 14.7L56 42L85.4 14.7C91 9.3 100 13.1 100 20.8V75.6C100 79.2 97.6 82 94 82.4L54.2 82L32.4 99.4V82H20.9C15.9 82 12 78 12 73V20.8C12 13.1 21 9.3 26.6 14.7Z";
const outlinePath =
  "M95.2 83.3C98.2 82 100 79.2 100 75.6V20.8C100 13.1 91 9.3 85.4 14.7L58.4 39.4C57.2 40.6 54.8 40.6 53.6 39.4L26.6 14.7C21 9.3 12 13.1 12 20.8V73C12 78 15.9 82 20.9 82H32.4V99.4L54.2 82H79.5C82.8 82 85.4 79.4 85.4 76.1V33";
const innerPath = "M26.6 70.6V33L53.6 58.6C54.8 59.8 57.2 59.8 58.4 58.6L85.4 33";
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("the mark is the traced logo and carries its own white bubble", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  // Three paths, not two: the bubble is filled white so the mark supplies its
  // own background instead of borrowing the contrast of the host page.
  assert.equal((logo.match(/<path\b/g) ?? []).length, 3);
  assert.match(logo, new RegExp(escape(bubblePath)));
  assert.match(logo, new RegExp(escape(outlinePath)));
  assert.match(logo, new RegExp(escape(innerPath)));
  assert.match(logo, /className="bl__bubble"[\s\S]*?fill="#ffffff"/);

  // The traced line is 4.6 units in a 112 box; at avatar size that would fall
  // under a pixel, so the weight is optically sized rather than fixed.
  assert.match(logo, /launcher: 4\.6, header: 5\.2, avatar: 6\.6/);

  // pathLength normalises both strokes so one dash length draws either.
  assert.match(logo, /pathLength: 100/);
});

test("animated lime harmony is the final runtime authority", async () => {
  const installer = await read("src/lib/installLimeWhiteStyles.ts");
  const approved = await read("src/approved-option-one-widget-final.css");
  const harmony = await read("src/professional-harmony-widget-final.css");
  const embed = await read("src/embed.tsx");

  assert.match(installer, /approved-option-one-widget-final\.css\?inline/);
  assert.match(installer, /professional-harmony-widget-final\.css\?inline/);
  assert.match(
    installer,
    /`\$\{limeWhiteCss\}\\n\$\{whiteGreenLockCss\}\\n\$\{approvedOptionOneCss\}\\n\$\{professionalHarmonyCss\}`/,
  );
  assert.match(installer, /animated-white-lime/);
  assert.match(embed, /installLimeWhiteStyles\(\)/);

  assert.match(approved, /--approved-lime: #b9ed4d/);
  assert.match(harmony, /--h-white: #ffffff/);
  assert.match(harmony, /--h-lime: #d9ff78/);
  assert.match(harmony, /--h-green-hover: #126d41/);
  assert.match(harmony, /\.cw-launcher\[class\][\s\S]*color: var\(--h-lime-main\) !important/);
  assert.match(harmony, /\.cw-launcher\[class\][\s\S]*background: transparent !important/);
  assert.match(harmony, /\.cw-launcher\[class\][\s\S]*animation: cw-logo-float/);
  assert.match(harmony, /@keyframes cw-logo-float/);
  assert.match(harmony, /\.cw-panel\[class\][\s\S]*animation: cw-panel-enter/);
  // The travelling pill is `__thumb` in the rendered markup; `__glass` is the
  // older name. Both have to be covered or the pill keeps the retired fill.
  assert.match(
    harmony,
    /:is\(\.cw-tabs__glass, \.cw-tabs__thumb\)\[class\][\s\S]*background: var\(--h-lime\) !important/,
  );
  assert.match(harmony, /\.cw-msg--user[\s\S]*background: var\(--h-lime\) !important/);
  assert.match(harmony, /button\[class\]:last-child[\s\S]*#a92f2f/);
  assert.match(harmony, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(harmony, forbiddenWarm);
});

test("the finish layer carries no palette of its own", async () => {
  const css = await read("src/masterpiece-final.css");

  // Every colour in this layer now comes from the identity tokens or from the
  // white/green family. The peach it used to hardcode outlived the palette it
  // belonged to and painted glows, rings and sweeps that no longer matched.
  assert.doesNotMatch(css, forbiddenWarm);
  assert.match(css, /--mp-accent: #b9ed4d/);
  assert.match(css, /--mp-ink-on-accent: #0b2f20/);

  // The dark fallbacks were the other half of the same problem: a missing
  // token would have repainted a white panel in the retired charcoal.
  for (const dark of ["#100e0c", "#18130f", "#201914", "#271e18", "#fff8f2", "rgba(10, 9, 8"]) {
    assert.ok(!css.includes(dark), `Retired dark surface ${dark} is back in the finish layer`);
  }
});

test("every surface between the canvas and the panel edge stays white", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");

  // The builder shortcut, the contact row and the step footer were still
  // painted with the retired dark surface, so each read as a black slab.
  assert.match(
    harmony,
    /:is\(\.cw-chat-top, \.cw-direct-actions, \.cw-calc-actions\)\[class\] \{[\s\S]*?background: var\(--h-white\) !important/,
  );
});

test("a chosen card and a waiting button both stay readable", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");

  // A selected card is deep green; its title was inheriting the near-black
  // that belonged to the retired warm fill and sat at 3.4:1 on it.
  assert.match(
    harmony,
    /\[data-selected="true"\], \[data-active="true"\], \[aria-pressed="true"\]\) :is\(b, strong, span, small, p, em, i\) \{[\s\S]*?color: inherit !important/,
  );

  // A disabled primary action says "not yet" with its fill, not by fading its
  // label out — half opacity put the label at 3:1 against its own surface.
  assert.match(
    harmony,
    /:is\(\.cw-next, \.cw-submit, \.cw-send\)\[class\]\[class\]:disabled[\s\S]*?color: var\(--h-muted\) !important;\s*\n\s*opacity: 1 !important/,
  );
});

test("the launcher mark reads on a white host page", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  const launcher = harmony.match(/\.cw-launcher\[class\] \{[^}]*\}/)?.[0];

  assert.ok(launcher, "launcher block missing");
  // A flat lime mark was 1.75:1 on white and needed a drawn-on rim. The white
  // bubble is the edge now, so the filter can go back to being elevation.
  assert.match(logo, /fill="#ffffff"/);
  assert.doesNotMatch(launcher, /drop-shadow\(0 0 1px/);
  assert.match(launcher, /drop-shadow\(0 12px 20px rgba\(11, 47, 32, 0\.26\)\)/);
  // Lime meets the page, green crosses the white body.
  assert.match(logo, /stopColor="#b9ed4d"/);
  assert.match(logo, /stopColor="#19834f"/);
  assert.match(harmony, /stroke: url\(#bl-ink-launcher\) !important/);
});

test("quick replies fit their labels on a small phone", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");
  const small = harmony.match(/@media \(max-width: 400px\) \{[\s\S]*?\n\}\n/)?.[0];

  assert.ok(small, "small-phone block missing");
  assert.match(small, /\.cw-chip\[class\]\[class\][\s\S]*padding-left: 12px !important/);
  assert.match(small, /\.cw-chip__label \{[\s\S]*font-size: 12\.8px !important/);
});

test("the launcher animates without moving the target it presents", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");

  // The halo breathes on a pseudo-element; the button itself only responds to
  // hover and press, so the hit area never drifts while it is being aimed at.
  assert.match(harmony, /\.cw-launcher\[class\]::before \{[\s\S]*?animation: cw-launcher-halo/);
  assert.match(harmony, /@keyframes cw-launcher-halo/);
  assert.match(harmony, /\.cw-launcher\[class\] \.bl--launcher \{[\s\S]*?animation: cw-logo-float/);
  assert.doesNotMatch(harmony, /\.cw-launcher\[class\] \{[^}]*animation: cw-logo-float/);

  // An !important declaration outranks an animation, so the start state lives
  // in the keyframes and is held by `both`.
  assert.match(harmony, /animation: cw-ink-draw 1150ms var\(--h-ease\) 120ms both/);
  assert.match(harmony, /animation: cw-bubble-in 620ms var\(--h-ease\) 620ms both/);
  assert.doesNotMatch(harmony, /stroke-dashoffset: 100 !important/);

  // The stagger must not leave a transform on the scroller once it is done.
  assert.match(harmony, /@keyframes cw-rise \{[\s\S]*?to \{ opacity: 1; transform: none; \}/);

  // Reduced motion may not leave the mark half-drawn.
  const reduced = harmony.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*$/)?.[0];
  assert.ok(reduced, "reduce block missing");
  assert.match(reduced, /stroke-dashoffset: 0 !important/);
  assert.match(reduced, /\.bl__bubble \{\s*\n\s*opacity: 1 !important/);
});
