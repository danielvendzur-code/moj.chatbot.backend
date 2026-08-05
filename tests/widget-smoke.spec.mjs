import { test, expect } from "@playwright/test";

const collectRuntimeErrors = (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

test("desktop visitor sees the website identity and stable configurator choices", async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });

  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();
  const launcherSurface = await launcher.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      backdrop: style.backdropFilter || style.webkitBackdropFilter,
    };
  });
  expect(launcherSurface.background).toBe("rgba(11, 47, 32, 0.76)");
  expect(launcherSurface.backdrop).toContain("blur(18px)");
  await expect(launcher.locator(".bl__outer")).toBeVisible();
  await expect(launcher.locator(".bl__inner")).toBeVisible();
  await launcher.click();

  const panel = page.locator(".cw-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByRole("heading", { name: "Môj Chatbot" })).toBeVisible();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await expect(page.getByText("Poradca a konfigurátor pre váš web")).toHaveCount(0);
  await expect(page.getByText("4 otázky · približne 1 minúta")).toBeVisible();
  await expect(page.locator(".cw-inputbar .cw-send")).toBeVisible();
  await expect(page.locator(".cw-panel-head .bl__outer")).toBeVisible();
  await expect(page.locator(".cw-panel-head .bl__inner")).toBeVisible();

  const tabs = page.locator(".cw-tabs");
  const thumb = tabs.locator(".cw-tabs__thumb");
  await expect(tabs).toHaveCSS("border-radius", "999px");
  await expect(tabs).toHaveCSS("background-color", "rgb(16, 39, 28)");
  await expect(thumb).toHaveCSS("background-color", "rgb(179, 233, 208)");
  await expect(tabs.locator("svg")).toHaveCount(0);
  const thumbBefore = await thumb.evaluate((element) => getComputedStyle(element).transform);

  const quickReply = page.getByRole("button", {
    name: "Kde mi to ušetrí čas?",
  });
  const quickReplyLabel = quickReply.locator(".cw-chip__label");
  await quickReply.click();
  await expect(quickReply).toHaveAttribute("data-sending", "true");
  await expect(quickReplyLabel).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");
  await page.waitForTimeout(300);
  await expect(quickReply).toBeVisible();
  await expect(quickReplyLabel).toHaveText("Kde mi to ušetrí čas?");

  await page.getByTestId("tab-calculator").click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Čo má web robiť za vás?" })).toBeVisible();
  const thumbAfter = await thumb.evaluate((element) => getComputedStyle(element).transform);
  expect(thumbAfter).not.toBe(thumbBefore);
  await expect(page.getByTestId("tab-calculator")).toHaveCSS("color", "rgb(11, 47, 32)");

  const interestChoice = page.getByTestId("interest-chatbot");
  const interestLabel = interestChoice.locator("b");
  await interestChoice.click();
  await expect(interestChoice).toHaveAttribute("data-selected", "true");
  await expect(interestLabel).toBeVisible();
  await expect(interestLabel).toHaveText(/\S+/);
  await page.waitForTimeout(300);
  const selectedVisual = await interestChoice.evaluate((element) => {
    const style = getComputedStyle(element);
    const label = element.querySelector("b");
    const labelStyle = label ? getComputedStyle(label) : null;
    const step = element.closest(".cw-calc-step");
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      labelOpacity: labelStyle?.opacity,
      labelVisibility: labelStyle?.visibility,
      stepOpacity: step ? getComputedStyle(step).opacity : null,
    };
  });
  expect(selectedVisual).toEqual({
    opacity: "1",
    visibility: "visible",
    backgroundColor: "rgb(234, 242, 232)",
    backgroundImage: "none",
    labelOpacity: "1",
    labelVisibility: "visible",
    stepOpacity: "1",
  });
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("industry-sluzby").click();
  await expect(page.getByTestId("feature-faq")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("feature-faq").click();
  await page.getByTestId("flow-next").click();
  await expect(page.getByTestId("timeline-asap")).toBeVisible({ timeout: 2500 });

  await page.getByTestId("timeline-asap").click();
  await expect(
    page.getByRole("heading", { name: "Kam vám môžem poslať ďalší krok?" }),
  ).toBeVisible({ timeout: 2500 });
  await expect(page.getByText("Krok 5 z 5 · Kontakt")).toBeVisible();
  await expect(page.getByText("Nezáväzný dopyt", { exact: true })).toBeVisible();

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

test("mobile switch and compact configurator remain usable", async ({ browser }) => {
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
  const box = await panel.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  expect(box).not.toBeNull();
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.y)).toBe(0);
  expect(Math.round(box.width)).toBe(viewport.width);
  expect(Math.round(box.height)).toBe(viewport.height);

  await expect(page.locator(".cw-tabs")).toHaveCSS("border-radius", "999px");
  await page.getByTestId("tab-calculator").click();
  await expect(page.locator(".cw-progress")).toBeVisible();
  await expect(page.locator(".cw-calc-actions")).toBeVisible();
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
