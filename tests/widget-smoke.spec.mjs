import { test, expect } from "@playwright/test";

const collectRuntimeErrors = (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

const expectBackButtonInsideProgress = async (page) => {
  const progress = page.locator(".cw-progress");
  const back = page.locator(".cw-progress__back");
  await expect(back).toBeVisible();

  const progressBox = await progress.boundingBox();
  const backBox = await back.boundingBox();
  expect(progressBox).not.toBeNull();
  expect(backBox).not.toBeNull();

  expect(backBox.x - progressBox.x).toBeGreaterThanOrEqual(3);
  expect(backBox.y - progressBox.y).toBeGreaterThanOrEqual(3);
  expect(progressBox.x + progressBox.width - (backBox.x + backBox.width)).toBeGreaterThanOrEqual(3);
  expect(progressBox.y + progressBox.height - (backBox.y + backBox.height)).toBeGreaterThanOrEqual(3);
};

test("desktop interactions stay clickable, unselected and visually stable", async ({
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

  const headerLogoStroke = page.locator(".cw-panel-head .bl__stroke");
  const launcherLogoStroke = launcher.locator(".bl__stroke");
  await expect(headerLogoStroke).toBeVisible();
  await expect(headerLogoStroke).toHaveCSS("animation-name", "none");
  await expect(launcherLogoStroke).toHaveCSS("animation-name", "none");
  await expect(headerLogoStroke).toHaveCSS("stroke-dashoffset", "0px");

  const composer = page.locator(".cw-inputbar");
  const composerInput = composer.locator("input");
  await composerInput.focus();
  await expect(composer).toHaveCSS("border-radius", "999px");
  await expect(composerInput).toHaveCSS("outline-style", "none");
  await expect(composerInput).toHaveCSS("border-top-width", "0px");

  const quickReply = page.getByRole("button", {
    name: "Kde mi to ušetrí čas?",
  });
  const quickReplyLabel = quickReply.locator(".cw-chip__label");

  // Editorial chips may lift by one pixel, but their contrast and hit area stay stable.
  await quickReply.hover();
  await page.waitForTimeout(480);
  await expect(quickReply).toHaveCSS("color", "rgb(7, 27, 21)");
  await expect(quickReply).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect
    .poll(() => quickReply.evaluate((element) => getComputedStyle(element, "::before").backgroundColor))
    .toBe("rgb(200, 240, 106)");

  await page.mouse.move(0, 0);
  await page.waitForTimeout(760);
  await expect(quickReply).toHaveCSS("color", "rgb(11, 14, 12)");
  await expect(quickReply).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect
    .poll(() => quickReply.evaluate((element) => getComputedStyle(element, "::before").backgroundColor))
    .toBe("rgb(200, 240, 106)");

  await quickReply.click();
  await expect(quickReply).toHaveAttribute("data-sending", "true");
  await expect(quickReplyLabel).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");
  await page.waitForTimeout(300);
  await expect(quickReply).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");

  const builderCta = page.locator(".cw-chat-builder");
  await expect(builderCta).toBeVisible();
  await builderCta.click();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(page.getByTestId("calculator-view")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible();

  await page.getByTestId("tab-assistant").click();
  await expect(panel).toHaveAttribute("data-mode", "assistant");
  await expect(page.locator('.cw-mode-view[data-view="assistant"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.getByTestId("tab-calculator").click();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(page.locator('.cw-mode-view[data-view="calculator"]')).toHaveAttribute(
    "data-active",
    "true",
  );

  const interestChoice = page.getByTestId("interest-chatbot");
  const interestLabel = interestChoice.locator("b");
  await expect(interestChoice).toHaveCSS("animation-name", "cw-goal-option-reveal");
  await expect(interestChoice).toHaveCSS("animation-duration", "0.52s");
  await interestChoice.click();

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

  await expect(
    page.locator('[data-testid^="industry-"][data-selected="true"]'),
  ).toHaveCount(0);
  await expect(page.locator(".cw-widget")).not.toHaveAttribute(
    "data-pointer-parked",
    "true",
    { timeout: 1200 },
  );

  await expectBackButtonInsideProgress(page);
  await page.locator(".cw-progress__back").click();
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible({ timeout: 2000 });
  await page.getByTestId("flow-next").click();
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2000 });

  await page.getByTestId("industry-sluzby").click();
  await expect(page.getByTestId("feature-jazyky")).toBeVisible({ timeout: 2500 });

  await expect(
    page.locator('[data-testid^="feature-"][data-selected="true"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid^="feature-"][data-recommended="true"]'),
  ).toHaveCount(0);

  await page.getByTestId("feature-jazyky").click();
  await page.getByTestId("flow-next").click();
  await expect(page.getByTestId("timeline-asap")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("timeline-asap").click();
  await expect(
    page.getByRole("heading", { name: "Váš návrh je pripravený" }),
  ).toBeVisible({ timeout: 2500 });
  await expect(page.getByText("Krok 5 z 5 · Kontakt")).toBeVisible();

  await expect(page.locator(".cw-contact-methods")).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.locator(".cw-reassure li")).toHaveCount(3);

  await page.getByTestId("lead-submit").click();
  await expect(page.getByRole("alert")).toContainText("Napíšte mi prosím svoje meno");
  await expect(page.getByPlaceholder("Vaše meno")).toHaveAttribute("aria-invalid", "true");

  await page.getByPlaceholder("Vaše meno").fill("Testovací návštevník");
  await page.getByPlaceholder("+421 …").fill("+421900123456");

  await expect(page.getByPlaceholder("Vaše meno")).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByPlaceholder("+421 …")).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByTestId("lead-submit")).toContainText("Chcem nezáväzný návrh");
  await expect(page.locator(".cw-summary")).not.toHaveAttribute("open", "");

  expect(errors).toEqual([]);
});

test("the e-mail chip opens the message form in the widget, not a mail client", async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);

  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").click();
  await expect(page.getByTestId("assistant-view")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("open-mail-form").click();
  const sheet = page.getByTestId("mail-sheet");
  await expect(sheet).toBeVisible({ timeout: 2000 });
  await expect(sheet.getByRole("heading", { name: "Napíšte mi" })).toBeVisible();

  await page.getByTestId("mail-send").click();
  await expect(page.getByRole("alert")).toContainText("Napíšte e-mail");

  await sheet.locator('input[type="email"]').fill("navstevnik@firma.sk");
  await page.getByTestId("mail-send").click();
  await expect(page.getByRole("alert")).toContainText("s čím vám môžem pomôcť");

  await sheet.locator("textarea").press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(page.getByTestId("assistant-view")).toBeVisible();

  expect(errors).toEqual([]);
});

test("mobile embed uses real taps for tabs and back navigation", async ({
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

  await page.goto("http://127.0.0.1:4173/?embed=1&viewport=mobile", {
    waitUntil: "networkidle",
  });
  await page.getByTestId("widget-launcher").tap();

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
  await page.locator(".cw-progress__back").tap();
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible({ timeout: 2000 });

  await page.getByTestId("tab-assistant").tap();
  await expect(panel).toHaveAttribute("data-mode", "assistant");
  await page.getByTestId("tab-calculator").tap();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await page.getByTestId("tab-assistant").tap();
  await expect(panel).toHaveAttribute("data-mode", "assistant");

  const inputHasFocus = await page.locator(".cw-inputbar input").evaluate(
    (input) => document.activeElement === input,
  );
  expect(inputHasFocus).toBe(false);
  await expect(page.locator(".cw-inputbar")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();

  expect(errors).toEqual([]);
  await context.close();
});
