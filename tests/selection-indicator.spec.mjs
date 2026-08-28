import { test, expect } from "@playwright/test";

const openCalculator = async (page) => {
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByTestId("widget-launcher").click();
  await page.locator(".cw-chat-builder").click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
};

const readSelectionSnapshot = async (card) =>
  card.evaluate((element) => {
    const indicator = element.querySelector(".cw-selection-indicator");
    const svg = indicator?.querySelector("svg");
    const path = svg?.querySelector("path");
    if (!(indicator instanceof HTMLElement) || !(svg instanceof SVGElement) || !(path instanceof SVGElement)) {
      throw new Error("Selection indicator geometry is missing");
    }
    const cardBox = element.getBoundingClientRect();
    const indicatorBox = indicator.getBoundingClientRect();
    const svgBox = svg.getBoundingClientRect();
    const cardStyle = getComputedStyle(element);
    const indicatorStyle = getComputedStyle(indicator);
    const pathStyle = getComputedStyle(path);
    return {
      selected: element.getAttribute("data-selected"),
      confirming: element.getAttribute("data-confirming"),
      cardBackground: cardStyle.backgroundColor,
      cardBorder: cardStyle.borderTopColor,
      indicatorOpacity: indicatorStyle.opacity,
      indicatorBackground: indicatorStyle.backgroundColor,
      checkStroke: pathStyle.stroke,
      cardCenterY: cardBox.top + cardBox.height / 2,
      indicatorCenterY: indicatorBox.top + indicatorBox.height / 2,
      indicatorCenterX: indicatorBox.left + indicatorBox.width / 2,
      svgCenterY: svgBox.top + svgBox.height / 2,
      svgCenterX: svgBox.left + svgBox.width / 2,
    };
  });

test("selection check is centered and selected cards stay light at rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCalculator(page);

  const selectedCard = page.getByTestId("interest-chatbot");
  const untouchedCard = page.getByTestId("interest-calcbot");
  await expect(untouchedCard.locator(".cw-selection-indicator")).toHaveCSS("opacity", "0");

  /* Programmatic click deliberately avoids a pointer hover. Existing smoke tests
     separately cover real mouse/touch interaction; this test measures the resting
     selected state before the 320ms auto-advance hand-off. */
  await selectedCard.evaluate((element) => element.click());
  await page.waitForFunction(() => {
    const card = document.querySelector('[data-testid="interest-chatbot"]');
    return card?.getAttribute("data-selected") === "true";
  });

  const snapshot = await readSelectionSnapshot(selectedCard);
  expect(snapshot.selected).toBe("true");
  expect(snapshot.cardBackground).toBe("rgb(248, 251, 245)");
  expect(snapshot.cardBorder).toBe("rgb(25, 131, 79)");
  expect(snapshot.indicatorOpacity).toBe("1");
  expect(snapshot.indicatorBackground).toBe("rgb(25, 131, 79)");
  expect(snapshot.checkStroke).toBe("rgb(255, 255, 255)");
  expect(Math.abs(snapshot.indicatorCenterY - snapshot.cardCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapshot.svgCenterY - snapshot.indicatorCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapshot.svgCenterX - snapshot.indicatorCenterX)).toBeLessThanOrEqual(1);
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
  const untouched = page.getByTestId("interest-calcbot");
  await expect(untouched.locator(".cw-selection-indicator")).toHaveCSS("opacity", "0");

  await card.evaluate((element) => element.click());
  await page.waitForFunction(() => {
    const selected = document.querySelector('[data-testid="interest-chatbot"]');
    return selected?.getAttribute("data-selected") === "true";
  });

  const snapshot = await readSelectionSnapshot(card);
  expect(snapshot.cardBackground).toBe("rgb(248, 251, 245)");
  expect(snapshot.cardBorder).toBe("rgb(25, 131, 79)");
  expect(snapshot.indicatorOpacity).toBe("1");
  expect(snapshot.indicatorBackground).toBe("rgb(25, 131, 79)");
  expect(Math.abs(snapshot.indicatorCenterY - snapshot.cardCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapshot.svgCenterY - snapshot.indicatorCenterY)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapshot.svgCenterX - snapshot.indicatorCenterX)).toBeLessThanOrEqual(1);

  await context.close();
});
