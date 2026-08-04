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

test("logo uses one filled bubble and a clear white M", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.doesNotMatch(logo, /bl__plate|<rect|bl__optical-weight/);
  assert.match(logo, /className="bl__bubble"/);
  assert.match(logo, /fill="currentColor"/);
  assert.match(logo, /className="bl__monogram"/);
  assert.match(logo, /stroke="white"/);
  assert.match(logo, /strokeWidth="8"/);
  assert.match(logo, /L100 106L69 89/);
});
