import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const rule = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
};

test("the e-mail chip writes the message here instead of handing over a mailto", async () => {
  const conversation = await read("src/components/widget/AssistantConversation.tsx");
  const sheet = await read("src/components/widget/MessageSheet.tsx");

  // The href survives as a fallback for copy/open-in-new-tab, but an ordinary
  // click must never leave for a mail client the visitor may not have.
  assert.match(conversation, /href="mailto:info@mojchatbot\.sk"/);
  assert.match(conversation, /event\.preventDefault\(\)/);
  assert.match(conversation, /setMailOpen\(true\)/);
  assert.match(conversation, /<MessageSheet onClose=/);
  assert.match(conversation, /data-testid="open-mail-form"/);

  // An address, a message, a photo. Nothing else may become required here.
  assert.match(sheet, /source: "widget-email"/);
  assert.match(sheet, /type="email"/);
  assert.match(sheet, /<textarea/);
  assert.match(sheet, /accept="image\/\*"/);
  assert.match(sheet, /Pridať fotku \(nepovinné\)/);
  assert.doesNotMatch(sheet, /type="checkbox"/);
  assert.match(sheet, /className="cw-consent-note"/);
  // Escape closes the sheet; without stopping it the panel handler underneath
  // closes the whole widget and the typed message is gone.
  assert.match(sheet, /stopImmediatePropagation/);
});

test("photos are shrunk in the browser before they are ever uploaded", async () => {
  const attachment = await read("src/lib/imageAttachment.ts");
  const api = await read("src/lib/leadApi.ts");

  assert.match(attachment, /MAX_ATTACHMENTS = 3/);
  assert.match(attachment, /MAX_EDGE = 1_600/);
  assert.match(attachment, /canvas\.toBlob/);
  assert.match(attachment, /"image\/jpeg"/);
  // A phone that cannot decode its own HEIC still gets the file through.
  assert.match(attachment, /passthrough/);

  assert.match(api, /attachments\?: LeadAttachment\[\]/);
  // 12 s is a keystroke's worth of patience, not a photo's.
  assert.match(api, /payload\.attachments\?\.length \? 45_000 : 12_000/);
});

test("the lead endpoint takes attachments without taking anything it should not", async () => {
  const lead = await read("api/lead.ts");

  assert.match(lead, /MAX_ATTACHMENTS = 3/);
  assert.match(lead, /MAX_ATTACHMENT_BYTES = 2_500_000/);
  assert.match(lead, /MAX_ATTACHMENTS_TOTAL_BYTES = 3_600_000/);
  assert.match(lead, /ALLOWED_ATTACHMENT_TYPES/);
  assert.match(lead, /"image\/jpeg"/);
  // Base64 in, base64 only: anything else never reaches the mail provider.
  assert.match(lead, /\^\[A-Za-z0-9\+\/\]\+=\{0,2\}\$/);
  assert.match(lead, /content_type: contentType/);
  assert.match(lead, /attachments\.length \? \{ attachments \} : \{\}/);

  // The quick form asks for an address and a message, so a name is derived
  // rather than demanded — every other rule still holds.
  assert.match(lead, /payload\.name = payload\.email\.split\("@"\)\[0\]/);
  assert.match(lead, /raw\.consent !== true/);
  assert.match(lead, /hasContact/);
});

test("a plain message is not emailed as a configurator brief with holes in it", async () => {
  const templates = await read("api/emailTemplates.ts");

  assert.match(templates, /const hasBrief =/);
  assert.match(templates, /brief \? "Zadanie" : "Detaily"/);
  assert.match(templates, /brief \? "Poznámka" : "Správa"/);
  assert.match(templates, /Správu sme prijali/);
  assert.match(templates, /lead\.attachments \? row\("Prílohy"/);
});

test("the mail sheet is a real surface in the widget's own language", async () => {
  const css = await read("src/product-widget.css");

  const sheet = rule(css, ".cw-sheet");
  assert.match(sheet, /position:\s*absolute/);
  assert.match(sheet, /inset:\s*0/);
  // The builder card is pinned at 7 by a later layer, so 4 left the sheet's
  // own header rendering underneath it.
  assert.match(sheet, /z-index:\s*12/);
  assert.match(rule(css, ".cw-conversation"), /position:\s*relative/);
  assert.match(rule(css, ".cw-photos__add"), /border-radius:\s*var\(--cw-r-pill\)/);
  assert.match(rule(css, ".cw-sheet__back"), /border-radius:\s*50%/);
});
