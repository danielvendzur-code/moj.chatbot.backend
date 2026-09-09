import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../src/embed-surface-authority-final.css", import.meta.url),
  "utf8",
);

test("launcher uses a forest bubble on dark surfaces and quiet glass on light surfaces", () => {
  assert.match(css, /border:\s*1px solid rgba\(200, 240, 106, 0\.34\) !important/);
  assert.match(css, /border-radius:\s*50% !important/);
  assert.match(css, /background:\s*rgba\(18, 56, 45, 0\.92\) !important/);
  assert.match(css, /\[data-surface-tone="light"\]/);
  assert.match(css, /background:\s*var\(--cw-glass-bg\) !important/);
  assert.match(css, /border-color:\s*rgba\(25, 131, 79, 0\.22\) !important/);
  assert.match(css, /background:\s*rgba\(18, 56, 45, 0\.98\) !important/);
  assert.doesNotMatch(css, /0 0 0 6px/);
  assert.doesNotMatch(css, /\.cw-launcher[^}]*background:\s*#(?:fff|ffffff)\b/is);
});
