import { test, expect } from "@playwright/test";

const mobileContext = {
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  reducedMotion: "no-preference",
};

const desktopContext = {
  viewport: { width: 1280, height: 800 },
  screen: { width: 1280, height: 800 },
  isMobile: false,
  hasTouch: false,
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
};

function measureDirectionalSteps(values) {
  let drawingSteps = 0;
  let erasingSteps = 0;
  let largestDrawingStep = 0;
  let largestErasingStep = 0;

  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    if (delta < -0.02) {
      drawingSteps += 1;
      largestDrawingStep = Math.max(largestDrawingStep, -delta);
    }
    if (delta > 0.02) {
      erasingSteps += 1;
      largestErasingStep = Math.max(largestErasingStep, delta);
    }
  }

  return {
    drawingSteps,
    erasingSteps,
    largestDrawingStep,
    largestErasingStep,
  };
}

async function verifyReverseErase(launcher) {
  await expect(launcher).toBeVisible();

  const stroke = launcher.locator('.bl__stroke[data-mobile-logo-motion="raf"]');
  await expect(stroke).toHaveCount(1);
  await expect(stroke).toHaveCSS("animation-name", "none");

  const result = await stroke.evaluate(async (element) => {
    const values = [];
    const computedValues = [];
    const opacityValues = [];
    const dataOpacityValues = [];
    const started = performance.now();

    while (performance.now() - started < 5700) {
      const dataValue = Number.parseFloat(element.dataset.mobileLogoOffset ?? "NaN");
      const computedValue = Number.parseFloat(getComputedStyle(element).strokeDashoffset);
      const opacityValue = Number.parseFloat(getComputedStyle(element).opacity);
      const dataOpacityValue = Number.parseFloat(element.dataset.mobileLogoOpacity ?? "NaN");
      if (
        Number.isFinite(dataValue) &&
        Number.isFinite(computedValue) &&
        Number.isFinite(opacityValue) &&
        Number.isFinite(dataOpacityValue)
      ) {
        values.push(dataValue);
        computedValues.push(computedValue);
        opacityValues.push(opacityValue);
        dataOpacityValues.push(dataOpacityValue);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 90));
    }

    return {
      values,
      computedValues,
      opacityValues,
      dataOpacityValues,
      priority: element.style.getPropertyPriority("stroke-dashoffset"),
      opacityPriority: element.style.getPropertyPriority("opacity"),
      inlineOffset: element.style.getPropertyValue("stroke-dashoffset"),
    };
  });

  expect(result.priority).toBe("important");
  expect(result.opacityPriority).toBe("important");
  expect(result.values.length).toBeGreaterThan(45);
  expect(Math.min(...result.values)).toBeLessThan(0.08);
  expect(Math.max(...result.values)).toBeGreaterThan(0.92);
  expect(result.values.some((value) => value > 0.2 && value < 0.8)).toBe(true);

  const direction = measureDirectionalSteps(result.values);
  expect(direction.drawingSteps).toBeGreaterThan(8);
  expect(direction.erasingSteps).toBeGreaterThan(8);
  expect(direction.largestDrawingStep).toBeGreaterThan(0.02);
  expect(direction.largestErasingStep).toBeGreaterThan(0.02);

  const directionRatio = direction.drawingSteps / direction.erasingSteps;
  expect(directionRatio).toBeGreaterThan(0.55);
  expect(directionRatio).toBeLessThan(1.8);

  const largestComputedDifference = result.values.reduce(
    (largest, value, index) =>
      Math.max(largest, Math.abs(value - result.computedValues[index])),
    0,
  );
  expect(largestComputedDifference).toBeLessThan(0.03);

  const largestOpacityDifference = result.opacityValues.reduce(
    (largest, value, index) =>
      Math.max(largest, Math.abs(value - result.dataOpacityValues[index])),
    0,
  );
  expect(largestOpacityDifference).toBeLessThan(0.03);

  const erasedSamples = result.values
    .map((offset, index) => ({ offset, opacity: result.opacityValues[index] }))
    .filter(({ offset }) => offset >= 0.995);
  expect(erasedSamples.length).toBeGreaterThan(1);
  expect(erasedSamples.every(({ opacity }) => opacity <= 0.01)).toBe(true);

  const drawnSamples = result.values
    .map((offset, index) => ({ offset, opacity: result.opacityValues[index] }))
    .filter(({ offset }) => offset <= 0.9);
  expect(drawnSamples.length).toBeGreaterThan(10);
  expect(drawnSamples.every(({ opacity }) => opacity >= 0.99)).toBe(true);

  expect(Number.parseFloat(result.inlineOffset)).toBeGreaterThanOrEqual(0);
}

async function verifyDesktopDrawErase(launcher) {
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");

  const stroke = launcher.locator(".bl__stroke");
  await expect(stroke).toHaveCount(1);
  await expect(stroke).toHaveCSS("animation-name", "cw-logo-draw-erase-loop");

  const values = await stroke.evaluate(async (element) => {
    const samples = [];
    const started = performance.now();

    while (performance.now() - started < 5700) {
      const value = Number.parseFloat(getComputedStyle(element).strokeDashoffset);
      if (Number.isFinite(value)) samples.push(value);
      await new Promise((resolve) => window.setTimeout(resolve, 90));
    }

    return samples;
  });

  expect(values.length).toBeGreaterThan(45);
  expect(Math.min(...values)).toBeLessThan(0.08);
  expect(Math.max(...values)).toBeGreaterThan(0.92);
  expect(values.some((value) => value > 0.2 && value < 0.8)).toBe(true);

  const direction = measureDirectionalSteps(values);
  expect(direction.drawingSteps).toBeGreaterThan(8);
  expect(direction.erasingSteps).toBeGreaterThan(8);
  expect(direction.largestDrawingStep).toBeGreaterThan(0.02);
  expect(direction.largestErasingStep).toBeGreaterThan(0.02);
}

test("mobile preview draws and progressively erases the single SVG stroke", async ({ browser }) => {
  const context = await browser.newContext(mobileContext);
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4173/?embed=1&viewport=mobile", {
    waitUntil: "networkidle",
  });

  await verifyReverseErase(page.getByTestId("widget-launcher"));
  await context.close();
});

test("production widget assets keep the same reverse erase on mobile", async ({ browser }) => {
  const context = await browser.newContext(mobileContext);
  const page = await context.newPage();

  await page.setContent(
    `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="http://127.0.0.1:4173/widget.css" />
        </head>
        <body>
          <script src="http://127.0.0.1:4173/widget.js"></script>
        </body>
      </html>`,
    { waitUntil: "networkidle" },
  );

  const launcher = page.locator("#dv-assistant-root [data-testid='widget-launcher']");
  await verifyReverseErase(launcher);
  await context.close();
});

test("desktop preview continuously draws and erases the closed launcher logo", async ({ browser }) => {
  const context = await browser.newContext(desktopContext);
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4173/?embed=1", { waitUntil: "networkidle" });
  await verifyDesktopDrawErase(page.getByTestId("widget-launcher"));

  await context.close();
});

test("production widget assets keep desktop draw and erase motion", async ({ browser }) => {
  const context = await browser.newContext(desktopContext);
  const page = await context.newPage();

  await page.setContent(
    `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="http://127.0.0.1:4173/widget.css" />
        </head>
        <body>
          <script src="http://127.0.0.1:4173/widget.js"></script>
        </body>
      </html>`,
    { waitUntil: "networkidle" },
  );

  const launcher = page.locator("#dv-assistant-root [data-testid='widget-launcher']");
  await verifyDesktopDrawErase(launcher);

  await context.close();
});
