import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const forbiddenWarm =
  /#ffc79d|#f0a873|#f3a75a|#e58a5b|#f4c9a8|#ffe38a|255\s*,\s*199\s*,\s*157|240\s*,\s*168\s*,\s*115/i;
const outerPath =
  "M93 84V23C93 13 81 9 74 16L56 34L38 16C31 9 19 13 19 23V70C19 81 27 89 38 89H47V104L63 89H78";
const innerPath = "M36 69V43L51 58C54 61 58 61 61 58L76 43V69";
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("widget uses the approved option 1 logo", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, new RegExp(escape(outerPath)));
  assert.match(logo, new RegExp(escape(innerPath)));
  assert.equal((logo.match(/<path\b/g) ?? []).length, 2);
  assert.match(logo, /strokeWidth="8\.5"/);
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

test("the launcher mark has an edge that reads on a white host page", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");
  const launcher = harmony.match(
    /\.cw-launcher\[class\] \{[\s\S]*?\n\}/,
  )?.[0];

  assert.ok(launcher, "launcher block missing");
  // Lime on white is 1.75:1 on its own, and this is the one control a visitor
  // has to find. A tight forest rim gives the stroke a boundary.
  assert.match(launcher, /drop-shadow\(0 0 1px rgba\(11, 47, 32, 0\.92\)\)/);
  assert.match(launcher, /color: var\(--h-lime-main\) !important/);
});

test("quick replies fit their labels on a small phone", async () => {
  const harmony = await read("src/professional-harmony-widget-final.css");
  const small = harmony.match(/@media \(max-width: 400px\) \{[\s\S]*?\n\}\n/)?.[0];

  assert.ok(small, "small-phone block missing");
  assert.match(small, /\.cw-chip\[class\]\[class\][\s\S]*padding-left: 12px !important/);
  assert.match(small, /\.cw-chip__label \{[\s\S]*font-size: 12\.8px !important/);
});
