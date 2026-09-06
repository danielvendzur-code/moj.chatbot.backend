import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("open widget brand mark is static while launcher alone may animate", async () => {
  const logo = await read("src/components/widget/BubbleLogo.tsx");

  assert.match(logo, /if \(size !== "launcher"\) return undefined/);
  assert.doesNotMatch(
    logo,
    /const shouldDriveWithRaf = size === "launcher" \|\| mobileQuery\.matches/,
  );
});

test("configurator renders exactly one selected check source", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const authority = await read("src/embed-surface-authority-final.css");

  assert.match(calculator, /<SelectionIndicator selected=\{selected\} \/>/);
  assert.match(
    authority,
    /\[data-selected="true"\]::after\s*\{[\s\S]*?content:\s*none\s*!important/,
  );
  assert.match(
    authority,
    /\.cw-selection-indicator\[class\]\[data-visible="true"\]/,
  );
  assert.doesNotMatch(
    authority,
    /\[data-selected="true"\]::after\s*\{[\s\S]*?background-image:\s*url/,
  );
});

test("lead fallback never navigates away automatically after submit", async () => {
  const calculator = await read("src/components/widget/ToolCalculator.tsx");
  const sheet = await read("src/components/widget/MessageSheet.tsx");

  for (const source of [calculator, sheet]) {
    assert.doesNotMatch(
      source,
      /if \(result\.fallback\) window\.location\.assign\(result\.fallback\)/,
    );
    assert.match(source, /setFallbackHref/);
    assert.match(source, /Otvoriť pripravený e-mail/);
  }
});

test("lead delivery channels have bounded upstream latency", async () => {
  const lead = await read("api/lead.ts");

  assert.match(lead, /RESEND_TIMEOUT_MS = 5_500/);
  assert.match(lead, /CONFIRMATION_TIMEOUT_MS = 3_000/);
  assert.match(lead, /WEBHOOK_TIMEOUT_MS = 2_500/);
  assert.match(lead, /async function fetchWithTimeout/);
  assert.match(lead, /controller\.abort\(\)/);
});

test("sales assistant uses Sonnet 4.6 with grounded product context", async () => {
  const chat = await read("api/chat.ts");

  assert.match(chat, /const MODEL = "claude-sonnet-4-6"/);
  assert.match(chat, /Chatbot alebo produktový poradca: od 347 €/);
  assert.match(chat, /Kalkulačka alebo konfigurátor: od 447 €/);
  assert.match(chat, /Technická prevádzka: 10 € mesačne/);
  assert.match(chat, /Najprv odpovedz na otázku/);
  assert.match(chat, /Nevymýšľaj zľavy, úspory, návratnosť ani falošnú urgenciu/);
  assert.match(chat, /Koverta, DERAT, Môj Plot a WEBKO/);
});
