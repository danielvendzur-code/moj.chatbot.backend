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
  const nativeMotion = stroke.locator('animate[data-mobile-logo-motion="true"]');
  await expect(stroke).toHaveCount(1);
  await expect(stroke).toBeVisible();
  await expect(nativeMotion).toHaveCount(1);
  await expect(stroke).toHaveCSS("animation-name", "none");

  const result = await stroke.evaluate(async (element) => {
    const animation = element.querySelector('animate[data-mobile-logo-motion="true"]');
    const svg = element.ownerSVGElement;
    if (!animation || !svg) throw new Error("Native mobile logo animation is missing");

    const paint = () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );

    await paint();

    let autoStarted = true;
    try {
      animation.getStartTime();
    } catch {
      autoStarted = false;
    }

    animation.endElement();
    animation.beginElement();
    await paint();
    const start = svg.getCurrentTime();
    svg.pauseAnimations();

    const readAt = (seconds) => {
      svg.setCurrentTime(start + seconds);
      return Number.parseFloat(getComputedStyle(element).strokeDashoffset);
    };

    return {
      autoStarted,
      values: animation.getAttribute("values"),
      keyTimes: animation.getAttribute("keyTimes"),
      duration: animation.getAttribute("dur"),
      repeatCount: animation.getAttribute("repeatCount"),
      samples: {
        drawing: readAt(1),
        complete: readAt(2.3),
        erasing: readAt(3.5),
        hidden: readAt(5),
      },
    };
  });

  expect(result.autoStarted).toBe(true);
  expect(result.values).toBe("1;1;0;0;1;1");
  expect(result.keyTimes).toBe("0;0.05;0.35;0.5;0.8;1");
  expect(result.duration).toBe("5.4s");
  expect(result.repeatCount).toBe("indefinite");
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
