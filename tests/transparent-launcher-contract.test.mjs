import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/embed-surface-authority-final.css', import.meta.url), 'utf8');

test('launcher keeps an almost-transparent circular glass bubble in every surface tone', () => {
  assert.match(css, /border:\s*1px solid rgba\(200, 240, 106, 0\.28\) !important/);
  assert.match(css, /border-radius:\s*50% !important/);
  assert.match(css, /background:\s*rgba\(7, 27, 21, 0\.055\) !important/);
  assert.match(css, /background:\s*rgba\(246, 245, 238, 0\.065\) !important/);
  assert.match(css, /border-color:\s*rgba\(18, 56, 45, 0\.24\) !important/);
  assert.match(css, /backdrop-filter:\s*blur\(10px\) saturate\(1\.04\) !important/);
  assert.match(css, /background:\s*rgba\(7, 27, 21, 0\.095\) !important/);
  assert.doesNotMatch(css, /\.cw-launcher[^}]*background:\s*#(?:fff|ffffff)\b/is);
});
