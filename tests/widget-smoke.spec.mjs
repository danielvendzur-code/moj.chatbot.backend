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

  // The closed launcher may erase the mark during its hover sequence, but the
  // completed animation must leave the full logo visible again. We deliberately
  // assert the rendered end state instead of coupling the regression to a
  // particular internal keyframe name.
  const closedLogoStroke = launcher.locator(".bl__stroke");
  await launcher.hover();
  await expect(closedLogoStroke).not.toHaveCSS("animation-name", "none");
  await page.waitForTimeout(5000);
  await expect(closedLogoStroke).toHaveCSS("stroke-dashoffset", "0px");
  await expect(closedLogoStroke).toHaveCSS("opacity", "1");

  await launcher.click();

  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByRole("heading", { name: "Môj Chatbot" })).toBeVisible();
  await expect(page.getByText("4 otázky · návrh máte do minúty")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();

  // Once open, both visible brand marks are completely static. The closed
  // launcher can animate before opening, but no logo motion belongs inside
  // an already-open conversation.
  const headerLogoStroke = page.locator(".cw-panel-head .bl__stroke");
  const launcherLogoStroke = launcher.locator(".bl__stroke");
  await expect(headerLogoStroke).toBeVisible();
  await expect(headerLogoStroke).toHaveCSS("animation-name", "none");
  await expect(launcherLogoStroke).toHaveCSS("animation-name", "none");
  await expect(headerLogoStroke).toHaveCSS("stroke-dashoffset", "0px");

  // The old white glass thumb used to trail the already-green active tab for
  // 560ms. It must be completely invisible and have zero transition duration.
  const tabThumb = page.locator(".cw-tabs__thumb");
  await expect(tabThumb).toHaveCSS("opacity", "0");
  await expect(tabThumb).toHaveCSS("transition-duration", "0s");

  // The browser focus ring belongs to the rounded composer shell, never to the
  // rectangular text input inside it.
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

  // Chat chips use the normal brand green for their centre fill. Only the fill
  // moves; the physical chip box stays completely still.
  await quickReply.hover();
  await page.waitForTimeout(480);
  await expect(quickReply).toHaveCSS("transform", "none");
  await expect(quickReply).toHaveCSS("color", "rgb(255, 255, 255)");
  const fillState = await quickReply.evaluate((chip) => {
    const before = getComputedStyle(chip, "::before");
    return {
      background: before.backgroundColor,
      transform: before.transform,
    };
  });
  expect(fillState.background).toBe("rgb(25, 131, 79)");
  expect(fillState.transform).not.toBe("none");
  expect(fillState.transform).not.toContain("matrix(0");

  await quickReply.click();
  await expect(quickReply).toHaveAttribute("data-sending", "true");
  await expect(quickReply).toHaveCSS("transform", "none");
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
  await expect(page.getByTestId("tab-calculator")).toHaveCSS(
    "background-color",
    "rgb(25, 131, 79)",
  );
  await expect(tabThumb).toHaveCSS("opacity", "0");

  // Real tab clicks must work in both directions, repeatedly, with no delayed
  // white layer arriving behind the green selected pill.
  await page.getByTestId("tab-assistant").click();
  await expect(panel).toHaveAttribute("data-mode", "assistant");
  await expect(page.getByTestId("tab-assistant")).toHaveCSS(
    "background-color",
    "rgb(25, 131, 79)",
  );
  await expect(tabThumb).toHaveCSS("opacity", "0");
  await expect(page.locator('.cw-mode-view[data-view="assistant"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.getByTestId("tab-calculator").click();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(page.getByTestId("tab-calculator")).toHaveCSS(
    "background-color",
    "rgb(25, 131, 79)",
  );
  await expect(tabThumb).toHaveCSS("opacity", "0");
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

  // Nothing in step 2 may inherit the click that chose step 1.
  await expect(
    page.locator('[data-testid^="industry-"][data-selected="true"]'),
  ).toHaveCount(0);
  await expect(page.locator(".cw-widget")).not.toHaveAttribute(
    "data-pointer-parked",
    "true",
    { timeout: 1200 },
  );

  // Back button must have a visible gutter on every side and really navigate.
  await expectBackButtonInsideProgress(page);
  await page.locator(".cw-progress__back").click();
  await expect(
    page.getByRole("heading", { name: "Aké riešenie chcete na web?" }),
  ).toBeVisible({ timeout: 2000 });
  await page.getByTestId("flow-next").click();
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2000 });

  await page.getByTestId("industry-sluzby").click();
  await expect(page.getByTestId("feature-jazyky")).toBeVisible({ timeout: 2500 });

  // Recommended ordering is allowed; selected answers are not. Step 3 must be
  // completely blank until the visitor chooses something.
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

  const tabThumb = page.locator(".cw-tabs__thumb");
  await expect(page.locator(".cw-tabs")).toHaveCSS("border-radius", "999px");
  await expect(tabThumb).toHaveCSS("opacity", "0");
  await expect(tabThumb).toHaveCSS("transition-duration", "0s");

  await page.getByTestId("tab-calculator").tap();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(page.getByTestId("tab-calculator")).toHaveCSS(
    "background-color",
    "rgb(25, 131, 79)",
  );
  await expect(tabThumb).toHaveCSS("opacity", "0");
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
  await expect(page.getByTestId("tab-assistant")).toHaveCSS(
    "background-color",
    "rgb(25, 131, 79)",
  );
  await expect(tabThumb).toHaveCSS("opacity", "0");
  await page.getByTestId("tab-calculator").tap();
  await expect(panel).toHaveAttribute("data-mode", "calculator");
  await expect(tabThumb).toHaveCSS("opacity", "0");
  await page.getByTestId("tab-assistant").tap();
  await expect(panel).toHaveAttribute("data-mode", "assistant");
  await expect(tabThumb).toHaveCSS("opacity", "0");

  const inputHasFocus = await page.locator(".cw-inputbar input").evaluate(
    (input) => document.activeElement === input,
  );
  expect(inputHasFocus).toBe(false);
  await expect(page.locator(".cw-inputbar")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();

  expect(errors).toEqual([]);
  await context.close();
});
