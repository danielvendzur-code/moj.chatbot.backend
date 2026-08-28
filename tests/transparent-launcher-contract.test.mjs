import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/logo-match-final.css', import.meta.url), 'utf8');

test('launcher stays transparent in rest hover focus and active states', () => {
  assert.match(css, /\.cw-launcher:is\(:hover, :focus-visible, :active\)/);
  assert.match(css, /background: transparent !important/);
  assert.match(css, /background-color: transparent !important/);
  assert.match(css, /border-color: transparent !important/);
  assert.match(css, /box-shadow: none !important/);
});
