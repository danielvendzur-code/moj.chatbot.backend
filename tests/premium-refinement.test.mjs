import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("assistant opens as a compact product rather than an empty fullscreen canvas", async () => {
  const css = await read("src/product-refinement.css");

  assert.match(
    rule(css, '.cw-widget .cw-panel[data-mode="assistant"]'),
    /height:\s*min\(596px,/,
  );
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /width:\s*min\(420px, calc\(100dvw - 16px\)\)/);
  assert.doesNotMatch(css, /\.cw-widget \.cw-panel\s*\{[^}]*inset:\s*0/s);
});

test("tabs and starter choices keep the approved pill geometry", async () => {
  const css = await read("src/product-refinement.css");

  assert.match(rule(css, ".cw-widget .cw-tabs"), /border-radius:\s*999px/);
  assert.match(
    rule(css, ".cw-widget .cw-tabs > button"),
    /border-radius:\s*999px/,
  );
  assert.match(
    rule(css, ".cw-widget .cw-quick-replies .cw-chip"),
    /border-radius:\s*999px/,
  );
  assert.match(css, /radial-gradient\(circle at center, #209257/);
});

test("composer is one clean pill and the CTA has clear sales hierarchy", async () => {
  const css = await read("src/product-refinement.css");

  assert.match(rule(css, ".cw-widget .cw-inputbar"), /border-radius:\s*999px/);
  assert.match(rule(css, ".cw-widget .cw-inputbar input"), /border:\s*0/);
  assert.match(
    rule(css, ".cw-widget .cw-inputbar > .cw-send"),
    /border-radius:\s*50%/,
  );
  assert.match(css, /content:\s*"4 krátke otázky • bez záväzku"/);
  assert.match(css, /content:\s*"Začať"/);
});

test("programmatic composer focus cannot hide the initial interface", async () => {
  const installer = await read("src/lib/installProductRefinement.ts");

  assert.match(installer, /lastPointerTarget/);
  assert.match(installer, /keyboardNavigationAt/);
  assert.match(installer, /input\.closest\("\.cw-inputbar"\)/);
  assert.match(installer, /input\.blur\(\)/);
});

test("logo is the website's outlined mark, not a redrawn approximation", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.doesNotMatch(logo, /bl__plate|<rect|bl__optical-weight/);
  assert.match(logo, /className="bl__outer"/);
  assert.match(logo, /className="bl__inner"/);
  assert.match(logo, /stroke="currentColor"/);
  assert.match(logo, /strokeWidth="7"/);
  assert.match(logo, /fill="none"/);
  assert.match(logo, /M28\.6 65\.1V32\.9L53\.4 57\.5/);
});

test("the archived rounded widget is restored with a colour-only final layer", async () => {
  const app = await read("src/App.tsx");
  const embedStyles = await read("src/launch-ready-styles.ts");
  const palette = await read("src/restored-widget-palette.css");

  for (const source of [app, embedStyles]) {
    assert.match(source, /restored-widget-palette\.css/);
    assert.doesNotMatch(source, /premium-widget-refinement|website-match-final|website-match-kage-final/);
  }

  assert.match(palette, /--restored-forest:\s*#12382d/);
  assert.match(palette, /--restored-paper:\s*#fcfbf7/);
  assert.match(palette, /--restored-lime:\s*#c8f06a/);
  assert.match(palette, /background:\s*var\(--restored-lime\)\s*!important/);
  assert.match(palette, /\.cw-tabs\s*>\s*button\[data-active="true"\][\s\S]*background:\s*var\(--restored-forest\)\s*!important/);
  assert.match(palette, /\.cw-calculator[\s\S]*\[data-selected="true"\][\s\S]*background:\s*var\(--restored-forest\)\s*!important/);
  assert.doesNotMatch(palette, /border-radius|linear-gradient|radial-gradient/);
});
