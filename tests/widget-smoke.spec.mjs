import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

mkdirSync("artifacts", { recursive: true });

const collectRuntimeErrors = (page) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
};

test("desktop widget keeps the new brand, compact switch and stable choices", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });

  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();
  await expect(launcher.locator(".bl__frame")).toBeVisible();
  await expect(launcher.locator(".bl__monogram")).toBeVisible();

  const launcherVisual = await launcher.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      radius: style.borderRadius,
      backdrop: style.backdropFilter || style.webkitBackdropFilter,
    };
  });
  expect(launcherVisual.background).toBe("rgba(236, 248, 241, 0.68)");
  expect(launcherVisual.radius).toBe("23px 23px 8px");
  expect(launcherVisual.backdrop).toContain("blur(18px)");

  await launcher.click();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await expect(page.locator(".cw-panel-head__mascot")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  const tabs = page.locator(".cw-tabs");
  const tabsBox = await tabs.boundingBox();
  expect(tabsBox).not.toBeNull();
  expect(tabsBox.width).toBeLessThanOrEqual(286.5);
  expect(tabsBox.height).toBeLessThanOrEqual(44.5);

  await page.getByTestId("tab-calculator").click();
  await expect(page.getByRole("heading", { name: "Čo má web robiť za vás?" })).toBeVisible();
  await expect(page.locator(".cw-progress__dots i:visible")).toHaveCount(4);

  const cards = page.locator(".cw-rowcard");
  await expect(cards).toHaveCount(4);
  const firstCardBox = await cards.first().boundingBox();
  expect(firstCardBox).not.toBeNull();
  expect(firstCardBox.height).toBeLessThanOrEqual(74);

  const next = page.getByTestId("flow-next");
  await expect(next).toBeDisabled();
  await expect(next).toHaveCSS("background-color", "rgb(237, 241, 237)");

  const interestChoice = page.getByTestId("interest-chatbot");
  const interestLabel = interestChoice.locator("b");
  await interestChoice.click();
  await expect(interestChoice).toHaveAttribute("data-selected", "true");
  await expect(interestLabel).toBeVisible();
  await page.waitForTimeout(420);
  await expect(interestChoice).toBeVisible();
  await expect(interestLabel).toBeVisible();
  await expect(interestLabel).toHaveText(/\S+/);
  await expect(interestChoice).toHaveCSS("background-color", "rgb(237, 247, 241)");
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });

  await page.locator(".cw-panel").screenshot({ path: "artifacts/widget-desktop.png" });
  expect(errors).toEqual([]);
});

test("mobile first step is full-screen, compact and visually balanced", async ({ browser }) => {
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
  await page.getByTestId("tab-calculator").click();

  const panel = page.locator(".cw-panel");
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

  const tabsBox = await page.locator(".cw-tabs").boundingBox();
  expect(tabsBox).not.toBeNull();
  expect(tabsBox.width).toBeLessThanOrEqual(278.5);
  expect(tabsBox.height).toBeLessThanOrEqual(43.5);

  await expect(page.locator(".cw-progress__dots i:visible")).toHaveCount(4);
  const cardHeights = await page.locator(".cw-rowcard").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(cardHeights.every((height) => height <= 72)).toBe(true);

  await expect(page.getByTestId("flow-next")).toBeDisabled();
  await expect(page.getByTestId("flow-next")).toHaveCSS("color", "rgb(126, 138, 130)");
  await panel.screenshot({ path: "artifacts/widget-mobile.png" });

  await page.getByTestId("interest-chatbot").click();
  await page.waitForTimeout(420);
  await expect(page.getByTestId("interest-chatbot").locator("b")).toBeVisible();
  await expect(page.getByTestId("industry-sluzby")).toBeVisible({ timeout: 2500 });

  expect(errors).toEqual([]);
  await context.close();
});
