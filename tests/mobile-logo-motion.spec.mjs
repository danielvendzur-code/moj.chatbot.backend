import { test, expect } from "@playwright/test";

const mobileContext = {
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  reducedMotion: "no-preference",
};

async function verifyReverseErase(launcher) {
  await expect(launcher).toBeVisible();

  const stroke = launcher.locator(".bl__stroke");
  await expect(stroke).toHaveCount(1);
  await expect(stroke).toBeVisible();
  await expect(stroke).toHaveCSS("animation-name", "cw-mobile-logo-draw-erase-loop");
  await expect(stroke).toHaveCSS("animation-duration", "5.4s");

  const result = await stroke.evaluate(async (element) => {
    const animation = element
      .getAnimations()
      .find((item) => item.animationName === "cw-mobile-logo-draw-erase-loop");
    if (!animation) throw new Error("Mobile logo CSS animation is not running");

    animation.pause();
    const paint = () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    const readAt = async (time) => {
      animation.currentTime = time;
      await paint();
      return Number.parseFloat(getComputedStyle(element).strokeDashoffset);
    };

    const keyframes = animation.effect
      ?.getKeyframes()
      .map((frame) => ({
        offset: frame.offset,
        strokeDashoffset: frame.strokeDashoffset ?? null,
      }));

    return {
      keyframes,
      samples: {
        drawing: await readAt(1000),
        complete: await readAt(2300),
        erasing: await readAt(3500),
        hidden: await readAt(5000),
      },
    };
  });

  expect(result.keyframes?.some((frame) => frame.strokeDashoffset === "1px")).toBe(true);
  expect(result.keyframes?.some((frame) => frame.strokeDashoffset === "0px")).toBe(true);
  expect(result.samples.complete).toBeLessThan(0.05);
  expect(result.samples.drawing).toBeGreaterThan(0.12);
  expect(result.samples.drawing).toBeLessThan(0.9);
  expect(result.samples.erasing).toBeGreaterThan(0.12);
  expect(result.samples.erasing).toBeLessThan(0.9);
  expect(result.samples.hidden).toBeGreaterThan(0.95);
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
