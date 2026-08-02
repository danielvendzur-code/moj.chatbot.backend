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
  assert.match(harmony, /\.cw-tabs__glass\[class\][\s\S]*background: var\(--h-lime\) !important/);
  assert.match(harmony, /\.cw-msg--user[\s\S]*background: var\(--h-lime\) !important/);
  assert.match(harmony, /button\[class\]:last-child[\s\S]*#a92f2f/);
  assert.match(harmony, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(harmony, forbiddenWarm);
});
