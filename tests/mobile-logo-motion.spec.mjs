import { test, expect } from "@playwright/test";

test("mobile logo draws and progressively erases on the same SVG stroke", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4173/?embed=1&viewport=mobile", {
    waitUntil: "networkidle",
  });

  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();

  const stroke = launcher.locator(".bl__stroke");
  await expect(stroke).toHaveCount(1);
  await expect(stroke).toBeVisible();
  await expect(stroke).toHaveCSS("animation-name", "cw-mobile-logo-draw-erase-loop");
  await expect(stroke).toHaveCSS("animation-duration", "5.4s");

  const samples = await stroke.evaluate((element) => {
    const animation = element
      .getAnimations()
      .find(
        (item) =>
          !(item instanceof CSSAnimation) || item.animationName === "cw-mobile-logo-draw-erase-loop",
      );
    if (!animation) throw new Error("Mobile logo CSS animation is not running");

    animation.pause();
    const readAt = (time) => {
      animation.currentTime = time;
      void element.getBoundingClientRect();
      return Number.parseFloat(getComputedStyle(element).strokeDashoffset);
    };

    return {
      drawing: readAt(1000),
      complete: readAt(2300),
      erasing: readAt(3500),
      hidden: readAt(5000),
    };
  });

  expect(samples.complete).toBeLessThan(0.05);
  expect(samples.drawing).toBeGreaterThan(0.12);
  expect(samples.drawing).toBeLessThan(0.9);
  expect(samples.erasing).toBeGreaterThan(0.12);
  expect(samples.erasing).toBeLessThan(0.9);
  expect(samples.hidden).toBeGreaterThan(0.95);

  await context.close();
});
