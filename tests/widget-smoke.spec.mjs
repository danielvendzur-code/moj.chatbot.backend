import { expect, test } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

async function assertNoRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return () => expect(errors, errors.join("\n")).toEqual([]);
}

async function openWidget(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();
  await launcher.click();
  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  return panel;
}

async function expectBackButtonInsideProgress(page) {
  const progress = page.locator(".cw-progress");
  const back = page.locator(".cw-progress__back");
  const progressBox = await progress.boundingBox();
  const backBox = await back.boundingBox();
  expect(progressBox).not.toBeNull();
  expect(backBox).not.toBeNull();
  expect(backBox.x).toBeGreaterThanOrEqual(progressBox.x - 1);
  expect(backBox.y).toBeGreaterThanOrEqual(progressBox.y - 1);
  expect(backBox.x + backBox.width).toBeLessThanOrEqual(progressBox.x + progressBox.width + 1);
  expect(backBox.y + backBox.height).toBeLessThanOrEqual(progressBox.y + progressBox.height + 1);
}

test("desktop interactions stay clickable, unselected and visually stable", async ({ page }) => {
  const assertNoErrors = await assertNoRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 920 });
  const panel = await openWidget(page);

  await expect(panel).toHaveAttribute("data-mode", "assistant");
  await expect(page.locator(".cw-panel-head__mascot")).toBeVisible();
  await expect(page.locator(".cw-composer")).toBeVisible();
  await expect(page.locator(".cw-quick-replies")).toBeVisible();

  await page.getByRole("button", { name: /Vyskladať riešenie/i }).click();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible();

  const unselected = page.getByTestId("interest-chatbot");
  await expect(unselected).toHaveAttribute("data-selected", "false");
  await expect(
    unselected.locator(".cw-selection-indicator"),
  ).toHaveAttribute("data-visible", "false");

  await unselected.click();
  await expect(unselected).toHaveAttribute("data-selected", "true");
  const selectionIndicator = unselected.locator(".cw-selection-indicator");
  await expect(selectionIndicator).toHaveAttribute("data-visible", "true");
  await expect(selectionIndicator).toHaveCSS("opacity", "1");
  await expect(selectionIndicator.locator("svg path")).toHaveCSS(
    "animation-name",
    "none",
  );

  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });
  await expect(
    page.locator('[data-testid^="industry-"][data-selected="true"]'),
  ).toHaveCount(0);
  await page.getByTestId("industry-sluzby").click();
  await expect(page.getByTestId("industry-sluzby")).toHaveAttribute("data-selected", "true");

  const featureCards = page.locator('[data-testid^="feature-"]');
  await expect(featureCards.first()).toBeVisible({ timeout: 2500 });
  await featureCards.first().click();
  await expect(featureCards.first()).toHaveAttribute("data-selected", "true");

  const nextButton = page.getByRole("button", { name: /Pokračovať/i });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(page.getByTestId("timeline-flexible")).toBeVisible({ timeout: 2500 });
  await page.getByTestId("timeline-flexible").click();
  await expect(page.getByTestId("timeline-flexible")).toHaveAttribute("data-selected", "true");
  await expect(page.getByRole("button", { name: /Pokračovať/i })).toBeEnabled();
  await page.getByRole("button", { name: /Pokračovať/i }).click();

  await expect(page.locator(".cw-lead-form")).toBeVisible({ timeout: 2500 });
  await page.getByLabel(/Meno/i).fill("Test User");
  await page.getByLabel(/E-mail/i).fill("test@example.com");
  await expect(page.locator(".cw-submit")).toBeEnabled();

  await page.locator(".cw-progress__back").click();
  await expect(page.getByTestId("timeline-flexible")).toBeVisible({ timeout: 2500 });
  await assertNoErrors();
});

test("the e-mail chip opens the message form in the widget, not a mail client", async ({ page }) => {
  const assertNoErrors = await assertNoRuntimeErrors(page);
  await page.setViewportSize({ width: 1360, height: 860 });
  await openWidget(page);

  const emailChip = page.getByTestId("open-mail-form");
  await expect(emailChip).toBeVisible();
  await emailChip.click();
  const sheet = page.getByRole("dialog", { name: /Napíšte nám/i });
  await expect(sheet).toBeVisible();
  await page.getByLabel(/Meno/i).fill("Test User");
  await page.getByLabel(/E-mail/i).fill("not-an-email");
  await page.getByRole("button", { name: /Odoslať/i }).click();
  await expect(page.getByText(/e-mail/i).last()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await assertNoErrors();
});

test("mobile embed uses real taps for tabs and back navigation", async ({ page }) => {
  const assertNoErrors = await assertNoRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/?embed=1`, { waitUntil: "networkidle" });

  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  await page.waitForTimeout(280);
  const box = await panel.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  expect(box).not.toBeNull();

  expect(box.width).toBeGreaterThanOrEqual(viewport.width * 0.9);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height * 0.9);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

  await expect(page.locator(".cw-tabs")).toHaveCSS("border-radius", "999px");
  await page.getByTestId("tab-calculator").tap();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible();

  await page.getByTestId("interest-chatbot").tap();
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });
  await expect(
    page.locator('[data-testid^="industry-"][data-selected="true"]'),
  ).toHaveCount(0);
  await expectBackButtonInsideProgress(page);
  await page.getByTestId("industry-sluzby").tap();

  await expect(page.locator('[data-testid^="feature-"]').first()).toBeVisible({ timeout: 2500 });
  await page.locator('[data-testid^="feature-"]').first().tap();
  await page.getByRole("button", { name: /Pokračovať/i }).tap();
  await expect(page.getByTestId("timeline-flexible")).toBeVisible({ timeout: 2500 });
  await page.getByTestId("timeline-flexible").tap();
  await page.getByRole("button", { name: /Pokračovať/i }).tap();

  await expect(page.locator(".cw-lead-form")).toBeVisible({ timeout: 2500 });
  await page.getByLabel(/Meno/i).tap();
  await page.getByLabel(/Meno/i).fill("Mobile Test");
  await page.getByLabel(/Telefón/i).tap();
  await page.getByLabel(/Telefón/i).fill("+421900000000");
  await page.getByLabel(/Poznámka/i).tap();
  await page.getByLabel(/Poznámka/i).fill("Mobile keyboard geometry test");

  await assertNoErrors();
});
