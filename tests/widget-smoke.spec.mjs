import { test, expect } from "@playwright/test";

const collectRuntimeErrors = (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

test("desktop visitor sees stable chip labels and completes the configurator", async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });

  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();
  await launcher.click();

  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByRole("heading", { name: "Môj Chatbot" })).toBeVisible();
  await expect(page.getByText("4 otázky · návrh máte do minúty")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();
  await expect(page.locator(".cw-panel-head .bl__stroke")).toBeVisible();

  const quickReply = page.getByRole("button", {
    name: "Kde mi to ušetrí čas?",
  });
  const quickReplyLabel = quickReply.locator(".cw-chip__label");

  // Hover stays pale green and the whole pill never shifts or scales.
  await quickReply.hover();
  await expect(quickReply).toHaveCSS("background-color", "rgb(201, 231, 199)");
  await expect(quickReply).toHaveCSS("transform", "none");

  await quickReply.click();
  await expect(quickReply).toHaveAttribute("data-sending", "true");
  await expect(quickReply).toHaveCSS("transform", "none");
  await expect(quickReplyLabel).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");
  await page.waitForTimeout(300);
  await expect(quickReply).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");

  // Regression guard: this CTA has repeatedly been blocked by historical
  // pointer/swipe layers. A real browser click must switch the rendered mode.
  const builderCta = page.locator(".cw-chat-builder");
  await expect(builderCta).toBeVisible();
  await builderCta.click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible();

  const interestChoice = page.getByTestId("interest-chatbot");
  const interestLabel = interestChoice.locator("b");
  await expect(interestChoice).toHaveCSS("animation-name", "cw-goal-option-reveal");
  await expect(interestChoice).toHaveCSS("animation-duration", "0.52s");
  await interestChoice.click();

  // Selection confirmation is now static: the SVG check is immediately visible
  // and no dash animation can leave it half-drawn or invisible.
  const selectionIndicator = interestChoice.locator(".cw-selection-indicator");
  await expect(selectionIndicator).toHaveAttribute("data-visible", "true");
  await expect(selectionIndicator).toHaveCSS("opacity", "1");
  await expect(selectionIndicator.locator("svg path")).toHaveCSS(
    "animation-name",
    "none",
  );

  await expect(interestLabel).toBeVisible();
  await expect(interestLabel).toHaveText(/\S+/);
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });

  // The click that chose step 1 must never select a card that appears underneath
  // the same pointer position in step 2.
  await expect(
    page.locator('[data-testid^="industry-"][data-selected="true"]'),
  ).toHaveCount(0);
  await expect(page.locator(".cw-widget")).not.toHaveAttribute(
    "data-pointer-parked",
    "true",
    { timeout: 1200 },
  );

  await page.getByTestId("industry-sluzby").click();
  await expect(page.getByTestId("feature-jazyky")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("feature-jazyky").click();
  await page.getByTestId("flow-next").click();
  await expect(page.getByTestId("timeline-asap")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("timeline-asap").click();
  await expect(
    page.getByRole("heading", { name: "Kam vám môžem poslať ďalší krok?" }),
  ).toBeVisible({ timeout: 2500 });
  await expect(page.getByText("Krok 5 z 5 · Kontakt")).toBeVisible();

  await page.getByTestId("lead-submit").click();
  await expect(page.getByRole("alert")).toContainText("Vyberte, ako sa vám mám ozvať");
  await expect(page.locator(".cw-contact-methods")).toHaveAttribute("aria-invalid", "true");

  await page.getByRole("button", { name: "Telefonicky" }).click();
  await page.getByPlaceholder("Vaše meno").fill("Testovací návštevník");
  await page.getByPlaceholder("+421 …").fill("+421900123456");
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("checkbox")).toBeChecked();

  await expect(page.getByPlaceholder("Vaše meno")).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByPlaceholder("+421 …")).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByTestId("lead-submit")).toContainText("Poslať nezáväzný dopyt");
  await expect(page.locator(".cw-summary")).not.toHaveAttribute("open", "");

  expect(errors).toEqual([]);
});

test("mobile mode switching never opens the software keyboard unexpectedly", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  const errors = collectRuntimeErrors(page);

  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").click();

  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  await page.waitForTimeout(260);
  const box = await panel.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  expect(box).not.toBeNull();

  // Layout can keep safe-area insets; this test only guards that the mobile
  // assistant remains a large, fully contained surface after its entrance.
  expect(box.width).toBeGreaterThanOrEqual(viewport.width * 0.9);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height * 0.9);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

  await expect(page.locator(".cw-tabs")).toHaveCSS("border-radius", "999px");
  await page.getByTestId("tab-calculator").click();
  await page.getByTestId("tab-assistant").click();
  await page.waitForTimeout(120);

  const inputHasFocus = await page.locator(".cw-inputbar input").evaluate(
    (input) => document.activeElement === input,
  );
  expect(inputHasFocus).toBe(false);
  await expect(page.locator(".cw-inputbar")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();

  expect(errors).toEqual([]);
  await context.close();
});
