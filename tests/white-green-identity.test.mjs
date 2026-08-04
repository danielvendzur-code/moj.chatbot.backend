import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const forbiddenWarm =
  /#ffc79d|#f0a873|#f3a75a|#e58a5b|#f4c9a8|#ffe38a|255\s*,\s*199\s*,\s*157|240\s*,\s*168\s*,\s*115/i;

test("widget uses the same exact vector mark as the website", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");
  assert.match(logo, /const OUTER =/);
  assert.match(logo, /const INNER =/);
  assert.match(logo, /viewBox="0 0 112 112"/);
  assert.match(logo, /strokeWidth="4\.3"/);
  assert.match(logo, /className=\{`bl bl--\$\{size\}`\}/);
  assert.doesNotMatch(logo, /data:image|<img\b|base64,/);
});

test("the finished website palette is appended as the final widget authority", async () => {
  const installer = await read("src/lib/installLimeWhiteStyles.ts");
  const brand = await read("src/site-green-brand-final.css");
  const chat = await read("src/site-green-chat-final.css");
  const config = await read("src/site-green-config-final.css");
  const mobile = await read("src/site-green-mobile-final.css");
  const polish = await read("src/web-aligned-polish-final.css");
  const correction = await read("src/header-tabs-correction-final.css");
  const finalCss = `${brand}\n${chat}\n${config}\n${mobile}\n${polish}\n${correction}`;

  for (const file of [
    "site-green-brand-final.css",
    "site-green-chat-final.css",
    "site-green-config-final.css",
    "site-green-mobile-final.css",
    "web-aligned-polish-final.css",
    "header-tabs-correction-final.css",
  ]) assert.ok(installer.includes(file), `Missing final stylesheet ${file}`);

  assert.match(installer, /headerTabsCorrectionCss\}`/);
  assert.match(installer, /site-white-forest-lime/);
  for (const token of ["#d9ff78", "#b9ed4d", "#19834f", "#0f6a3e", "#0b2f20", "#fff"]) {
    assert.ok(finalCss.includes(token), `Missing finished site token ${token}`);
  }
  assert.match(brand, /\.cw-tabs__thumb\[class\]/);
  assert.doesNotMatch(finalCss, /\.cw-tabs__glass/);
  assert.match(chat, /\.cw-message-row--me[\s\S]*background:var\(--sg-green\)!important/);
  assert.match(config, /\.cw-calc-actions\[class\][\s\S]*:disabled[\s\S]*background:transparent!important/);
  assert.match(brand, /data-assistant-open="true"/);
  assert.match(mobile, /prefers-reduced-motion:reduce/);
  assert.match(polish, /Odpoviem alebo vyskladám riešenie/);
  assert.match(polish, /\.cw-launcher\[class\]:hover[\s\S]*transform:\s*none !important/);
  assert.match(polish, /radial-gradient\(circle at center, var\(--wa-green\)/);
  assert.match(polish, /background-size:\s*260% 260% !important/);
  assert.match(polish, /Získať návrh riešenia/);
  assert.match(polish, /\.cw-inputbar\[class\]\s*>\s*\.cw-send\[class\]:disabled[\s\S]*visibility:\s*visible !important/);
  assert.match(correction, /Odpovedám hneď/);
  assert.match(correction, /border-radius:\s*16px !important/);
  assert.match(correction, /\.cw-tabs__thumb\[class\]/);
  assert.doesNotMatch(finalCss, forbiddenWarm);
});

test("backward step navigation releases the tall-step height lock", async () => {
  const transition = await read("src/hooks/useStepTransition.ts");
  assert.match(transition, /nextDirection === "forward"/);
  assert.match(transition, /nextDirection === "backward"/);
  assert.match(transition, /container\.style\.minHeight = ""/);
  assert.match(transition, /direction === "backward"/);
});

test("mobile iframe freezes and restores the parent page on iOS", async () => {
  const embed = await read("public/embed.js");
  assert.match(embed, /document\.body\.style\.position = "fixed"/);
  assert.match(embed, /document\.body\.style\.top = -savedScrollY \+ "px"/);
  assert.match(embed, /document\.body\.style\.left = -savedScrollX \+ "px"/);
  assert.match(embed, /document\.documentElement\.style\.touchAction = "none"/);
  assert.match(embed, /document\.body\.style\.overscrollBehavior = "none"/);
  assert.match(embed, /document\.body\.style\.position = savedBodyPosition/);
  assert.match(embed, /window\.scrollTo\(savedScrollX, savedScrollY\)/);
});
