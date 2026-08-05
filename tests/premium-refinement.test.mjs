import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("retired refinement files are not loaded by either runtime", async () => {
  const main = await read("src/main.tsx");
  const embed = await read("src/embed.tsx");

  for (const source of [main, embed]) {
    assert.doesNotMatch(source, /product-refinement\.css/);
    assert.doesNotMatch(source, /installProductRefinement/);
    assert.doesNotMatch(source, /assistant-redesign|masterpiece-final/);
  }
});

test("the live composer remains one clean input surface", async () => {
  const css = await read("src/product-widget.css");

  assert.match(css, /\.cw-inputbar\s*\{/);
  assert.match(css, /\.cw-inputbar input\s*\{/);
  assert.match(css, /\.cw-inputbar > \.cw-send\s*\{/);
  assert.match(css, /border-radius:\s*19px/);
  assert.match(css, /\.cw-inputbar input[\s\S]*?border:\s*0/);
});

test("the replacement logo is simple enough for all three sizes", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, /size: "launcher" \| "header" \| "avatar"/);
  assert.match(logo, /viewBox="0 0 64 64"/);
  assert.match(logo, /className="bl__frame"/);
  assert.match(logo, /className="bl__monogram"/);
  assert.equal((logo.match(/strokeWidth="4\.4"/g) ?? []).length, 2);
  assert.doesNotMatch(logo, /<rect|fill="currentColor"|data:image|base64/);
});
