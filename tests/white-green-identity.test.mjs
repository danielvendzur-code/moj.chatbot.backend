import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const forbiddenWarm = /#ffc79d|#f0a873|#f3a75a|#e58a5b|#f4c9a8|255\s*,\s*199\s*,\s*157|240\s*,\s*168\s*,\s*115/i;
const singleLinePath =
  "M69 103L69 88H82C93 88 101 80 101 69V23C101 14 91 10 84 17L64 37C59 42 53 42 48 37L28 17C21 10 11 14 11 23V69C11 80 19 88 30 88H54L69 103Z";

test("widget uses the same one-line logo as the public website", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, new RegExp(singleLinePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal((logo.match(/<path\b/g) ?? []).length, 1);
  assert.doesNotMatch(logo, /<g\b|translate\(112 0\) scale\(-1 1\)/);
  assert.match(logo, /strokeWidth="8\.5"/);
});

test("strict widget identity is appended after the compatibility theme", async () => {
  const installer = await read("src/lib/installLimeWhiteStyles.ts");
  const css = await read("src/white-green-identity-lock.css");
  const embed = await read("src/embed.tsx");

  assert.match(installer, /lime-white-widget-final\.css\?inline/);
  assert.match(installer, /white-green-identity-lock\.css\?inline/);
  assert.match(installer, /`\$\{limeWhiteCss\}\\n\$\{whiteGreenLockCss\}`/);
  assert.match(embed, /installLimeWhiteStyles\(\)/);

  assert.match(css, /html:root body \.cw-widget\[class\]\[class\]\[class\]\[class\]/);
  assert.match(css, /--mc-brand: #b9ed4d/);
  assert.match(css, /--lw-forest: #0b2f20/);
  assert.match(css, /\.cw-launcher\[class\][\s\S]*background: transparent !important/);
  assert.match(css, /\.cw-panel-head\[class\][\s\S]*#0b2f20 !important/);
  assert.match(css, /\.cw-panel\[class\][\s\S]*#ffffff !important/);
  assert.doesNotMatch(css, forbiddenWarm);
});
