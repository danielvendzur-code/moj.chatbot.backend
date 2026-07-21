import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("primary actions use mint and red is reserved for close hover", async () => {
  const css = await read("src/requested-polish.css");
  assert.match(css, /--cw-action:\s*#64e3b3/i);
  assert.match(css, /--cw-action-hover:\s*#7af0c5/i);
  assert.match(css, /\.cw-panel-head__close:hover[\s\S]*?#ff6c67/i);
  assert.doesNotMatch(css, /--cw-action:\s*#f26f4f/i);
  assert.doesNotMatch(css, /--cw-action-hover:\s*#ff8060/i);
});

test("mode tabs switch directly and expose online state", async () => {
  const widget = await read("src/components/widget/AssistantWidget.tsx");
  assert.match(widget, /<i aria-hidden="true" \/> Online/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("calculator"\)\}/);
  assert.match(widget, /onClick=\{\(\) => switchMode\("assistant"\)\}/);
  assert.doesNotMatch(widget, /onPointerMove=\{handleTabPointerMove\}/);
});

test("builder flow omits priority and keeps contact as final step", async () => {
  const flow = await read("src/lib/assistantFlow.ts");
  const stepsMatch = flow.match(/export const STEPS:[\s\S]*?= \[([\s\S]*?)\];/);
  assert.ok(stepsMatch, "STEPS definition missing");
  const steps = stepsMatch[1];
  assert.doesNotMatch(steps, /"priority"/);
  assert.match(steps, /"contact"\s*,?\s*$/m);
  assert.match(flow, /whatsapp/);
  assert.match(flow, /volanie/);
  assert.match(flow, /platba/);
});

test("final screen visually orders contact before summary", async () => {
  const css = await read("src/requested-polish.css");
  assert.match(css, /> \.cw-lead \{ order: 1; \}/);
  assert.match(css, /> \.cw-summary \{ order: 2;/);
});

test("quick replies do not drag horizontally and wrap on mobile", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const polish = await read("src/world-class-polish.css");
  const main = await read("src/main.tsx");
  assert.doesNotMatch(conversation, /useHorizontalDrag|quickRepliesDrag/);
  assert.match(conversation, /Konfigurátor/);
  assert.match(polish, /\.cw-quick-replies[\s\S]*?flex-wrap:\s*wrap/i);
  assert.match(polish, /touch-action:\s*pan-y/i);
  assert.match(polish, /font-size:\s*16px !important/i);
  assert.match(main, /world-class-polish\.css/);
});
