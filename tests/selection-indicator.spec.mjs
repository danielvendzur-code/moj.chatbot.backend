import { test, expect } from "@playwright/test";

const openCalculator = async (page) => {
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").click();
  await page.locator(".cw-chat-builder").click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
};

test("selection check is centered and selected cards stay light at rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCalculator(page);

  const selectedCard = page.getByTestId("interest-chatbot");
  const untouchedCard = page.getByTestId("interest-calculator");
  const untouchedIndicator = untouchedCard.locator(".cw-selection-indicator");

  await expect(untouchedIndicator).toHaveCSS("opacity", "0");
  await selectedCard.click();

  const indicator = selectedCard.locator(".cw-selection-indicator");
  const check = indicator.locator("svg");
  await expect(indicator).toHaveCSS("opacity", "1");
  await expect(selectedCard).toHaveCSS("background-color", "rgb(248, 251, 245)");
  await expect(selectedCard).toHaveCSS("border-top-color", "rgb(25, 131, 79)");
  await expect(indicator).toHaveCSS("background-color", "rgb(25, 131, 79)");
  await expect(check.locator("path")).toHaveCSS("stroke", "rgb(255, 255, 255)");

  const geometry = await selectedCard.evaluate((card) => {
    const indicator = card.querySelector(".cw-selection-indicator");
    const svg = indicator?.querySelector("svg");
    if (!(indicator instanceof HTMLElement) || !(svg instanceof SVGElement)) {
      throw new Error("Selection indicator geometry is missing");
    }
    const cardBox = card.getBoundingClientRect();
    const indicatorBox = indicator.getBoundingClientRect();
    const svgBox = svg.getBoundingClientRect();
    return {
      cardCenterY: cardBox.top + cardBox.height / 2,
      indicatorCenterY: indicatorBox.top + indicatorBox.height / 2,
      indicatorCenterX: indicatorBox.left + indicatorBox.width / 2,
      svgCenterY: svgBox.top + svgBox.height / 2,
      svgCenterX: svgBox.left + svgBox.width / 2,
    };
  });

  expect(Math.abs(geometry.indicatorCenterY - geometry.cardCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.svgCenterY - geometry.indicatorCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.svgCenterX - geometry.indicatorCenterX)).toBeLessThanOrEqual(1);
});

test("mobile selection uses the same centered check without hover-only dark fill", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/?embed=1&viewport=mobile", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").tap();
  await page.getByTestId("tab-calculator").tap();

  const card = page.getByTestId("interest-chatbot");
  const untouched = page.getByTestId("interest-calculator");
  await expect(untouched.locator(".cw-selection-indicator")).toHaveCSS("opacity", "0");
  await card.tap();

  await expect(card).toHaveCSS("background-color", "rgb(248, 251, 245)");
  const indicator = card.locator(".cw-selection-indicator");
  await expect(indicator).toHaveCSS("opacity", "1");

  const deltaY = await card.evaluate((element) => {
    const indicator = element.querySelector(".cw-selection-indicator");
    if (!(indicator instanceof HTMLElement)) throw new Error("Selection indicator missing");
    const cardBox = element.getBoundingClientRect();
    const indicatorBox = indicator.getBoundingClientRect();
    return Math.abs(
      cardBox.top + cardBox.height / 2 - (indicatorBox.top + indicatorBox.height / 2),
    );
  });
  expect(deltaY).toBeLessThanOrEqual(1);

  await context.close();
});
