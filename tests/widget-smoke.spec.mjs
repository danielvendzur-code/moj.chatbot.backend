import { test, expect } from "@playwright/test";
import { createServer } from "node:http";

async function observe(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      json: { reply: "Pomôžeme pripraviť konkrétny návrh." },
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.route("**/api/lead", (route) =>
    route.fulfill({
      json: { ok: true },
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  return errors;
}

async function openChat(page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").click();
  await expect(page.locator(".cw-panel")).toBeVisible();
}

test("desktop chat sends a reply and keeps welcome and response actions", async ({
  page,
}) => {
  const errors = await observe(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openChat(page);
  await expect(
    page.getByRole("heading", { name: "Môj Chatbot" }),
  ).toBeVisible();
  await expect(page.locator(".cw-tabs")).toHaveCount(0);
  await expect(page.getByTestId("widget-reset")).toHaveCount(0);
  await expect(page.locator(".cw-panel-head .mc-mark")).toBeVisible();
  await page.getByPlaceholder("Napíšte otázku…").fill("Koľko to stojí?");
  await page.getByRole("button", { name: "Odoslať správu" }).click();
  await expect(
    page.getByText("Pomôžeme pripraviť konkrétny návrh."),
  ).toBeVisible();
  await expect(page.locator(".cw-welcome-actions")).toHaveCount(1);
  await expect(
    page.locator('.cw-message[data-message-id="1"] button'),
  ).toHaveCount(0);
  await expect(page.locator(".cw-reply-actions")).toHaveCount(1);
  await expect(
    page
      .getByRole("button", { name: "Vyskladať riešenie", exact: true })
      .last(),
  ).toBeVisible();
  await page.getByTestId("widget-close").click();
  await expect(page.locator(".cw-panel")).toBeHidden();
  expect(errors).toEqual([]);
});

test("builder preserves selections, validates and submits a complete brief", async ({
  page,
}) => {
  const errors = await observe(page);
  await openChat(page);
  await page
    .getByRole("button", { name: "Vyskladať riešenie", exact: true })
    .click();
  await expect(page.getByTestId("interest-custom").locator("b")).toHaveText(
    "Riešenie na mieru",
  );
  await page.getByTestId("interest-chatbot").click();
  await expect(page.locator('[data-step="features"]')).toBeVisible();
  await expect(
    page.locator('[data-testid^="feature-"][data-selected="true"]'),
  ).toHaveCount(0);
  // Compare dimensions, since Playwright may scroll the overflow panel on click.
  const chipSizes = () =>
    page.locator('[data-testid^="feature-"]').evaluateAll((chips) =>
      chips.map((chip) => ({
        id: chip.dataset.testid,
        width: chip.offsetWidth,
        height: chip.offsetHeight,
      })),
    );
  const sizesBefore = await chipSizes();
  await page.getByTestId("feature-leads").click();
  expect(await chipSizes()).toEqual(sizesBefore);
  await page.getByTestId("feature-jazyky").click();
  await page.getByTestId("flow-next").click();
  await expect(page.locator('[data-step="details"]')).toBeVisible();
  await page.locator(".cw-progress__back").click();
  await expect(page.locator('[data-step="features"]')).toBeVisible();
  await expect(
    page.locator('[data-testid^="feature-"][data-selected="true"]'),
  ).toHaveCount(2);
  await page.getByTestId("flow-next").click();
  await page.getByTestId("detail-chat-offer").click();
  await page.getByTestId("flow-next").click();
  await page.getByTestId("industry-sluzby").click();
  await page.getByTestId("timeline-asap").click();
  await expect(page.locator('[data-step="contact"]')).toBeVisible();
  await page.getByTestId("lead-submit").click();
  await expect(page.getByRole("alert")).toContainText(
    "Napíšte mi prosím svoje meno",
  );
  await page.getByPlaceholder("Vaše meno").fill("Testovací návštevník");
  await page.getByPlaceholder("meno@firma.sk").fill("qa@example.com");
  await page.getByTestId("lead-submit").click();
  await expect(page.getByText("Ďakujem, Testovací návštevník.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("contact opens inside the widget and validates before sending", async ({
  page,
}) => {
  const errors = await observe(page);
  await openChat(page);
  await page.getByTestId("open-mail-form").click();
  const sheet = page.getByTestId("mail-sheet");
  await expect(sheet).toBeVisible();
  await expect(page.locator(".cw-sheet__back svg")).toBeVisible();
  await page
    .getByRole("button", { name: "Späť do chatu", exact: true })
    .click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByPlaceholder("Napíšte otázku…")).toBeVisible();
  await page.getByTestId("open-mail-form").click();
  await page.getByTestId("mail-send").click();
  await expect(page.getByRole("alert")).toContainText("Napíšte e-mail");
  await sheet.locator('input[type="email"]').fill("qa@example.com");
  await page.getByTestId("mail-send").click();
  await expect(page.getByRole("alert")).toContainText("s čím vám môžem pomôcť");
  await sheet.locator("textarea").press("Escape");
  await expect(sheet).toHaveCount(0);
  await page.getByTestId("open-mail-form").click();
  await sheet.locator('input[type="email"]').fill("qa@example.com");
  await sheet.locator("textarea").fill("Prosím o návrh chatbota pre web.");
  await page.getByTestId("mail-send").click();
  await expect(
    sheet.getByRole("heading", { name: "Správa odoslaná" }),
  ).toBeVisible();
  await sheet
    .getByRole("button", { name: "Späť do chatu", exact: true })
    .last()
    .click();
  await expect(sheet).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile taps open builder, return to chat and restore page scrolling", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = await observe(page);
  await openChat(page);
  await page
    .getByRole("button", { name: "Vyskladať riešenie", exact: true })
    .tap();
  await expect(page.getByTestId("interest-chatbot")).toBeVisible();
  const box = await page.locator(".cw-panel").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.locator(".cw-progress__back").tap();
  await expect(page.locator(".cw-inputbar")).toBeVisible();
  await page.getByTestId("widget-close").tap();
  await expect(page.locator(".cw-panel")).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-assistant-open",
    "true",
  );
  expect(errors).toEqual([]);
  await context.close();
});

test("draft survives Enter during a streamed reply and sends after completion", async ({
  page,
}) => {
  const errors = await observe(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let requests = 0;
  const reply =
    "**Kalkulačka** spočíta cenu podľa rozmerov.\n\n" +
    "Vyberiete model, rozmery a výbavu podľa svojich potrieb. ".repeat(6);
  await page.route("**/api/chat", (route) => {
    requests += 1;
    return route.fulfill({
      json: { reply },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await openChat(page);
  const input = page.getByPlaceholder("Napíšte otázku…");
  const send = page.getByRole("button", { name: "Odoslať správu" });
  await input.fill("Ako mi pomôže kalkulačka?");
  await send.click();
  await expect(
    page.locator('.cw-message-row--bot[data-streaming="true"]'),
  ).toBeVisible();
  await input.fill("A čo konfigurátor?");
  await expect(send).toBeDisabled();
  await input.press("Enter");
  await expect(input).toHaveValue("A čo konfigurátor?");
  expect(requests).toBe(1);
  await expect(send).toBeEnabled();
  await expect(page.locator(".cw-message-row--bot strong").first()).toHaveText(
    "Kalkulačka",
  );
  await send.click();
  await expect.poll(() => requests).toBe(2);
  await expect(input).toHaveValue("");
  expect(errors).toEqual([]);
});

test("stalled stream releases the composer and keeps received text", async ({
  page,
}) => {
  const server = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write('event: delta\ndata: {"text":"Máme váš výber. "}\n\n');
    // Deliberately keep the connection open: simulate a lost upstream stream.
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/stalled`;
  try {
    await page.addInitScript((url) => {
      window.__DV_ASSISTANT_ENDPOINT__ = url;
    }, endpoint);
    await page.clock.install();
    await openChat(page);
    const input = page.getByRole("textbox", { name: "Vaša otázka" });
    await expect(input).toBeFocused();
    await input.fill("Čo mám vybrať?");
    await page.getByRole("button", { name: "Odoslať správu" }).click();
    await expect(page.getByText("Máme váš výber.")).toBeVisible();
    await input.fill("Ďalšia otázka");
    await page.clock.fastForward(16_000);
    await expect(page.locator('[data-streaming="true"]')).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Odoslať správu" }),
    ).toBeEnabled();
    await expect(input).toHaveValue("Ďalšia otázka");
    await expect(page.getByText("Máme váš výber.")).toBeVisible();
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
