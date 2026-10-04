import { test, expect } from "@playwright/test";

async function verifyAdaptiveFill(page, launcher) {
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
  await expect(launcher).toHaveCSS("border-radius", "50%");
  await expect(launcher.locator(".cw-launcher__icon")).toHaveCount(1);
  const iconBefore = await launcher
    .locator(".cw-launcher__icon")
    .evaluate((el) => el.outerHTML);
  const shadowBefore = await launcher.evaluate(
    (el) => getComputedStyle(el).boxShadow,
  );

  for (const [tone, background, fill] of [
    ["dark", "#071b15", "rgb(31, 128, 83)"],
    ["light", "#ffffff", "rgb(18, 56, 45)"],
  ]) {
    await page.evaluate((background) => {
      let surface = document.getElementById("test-background");
      if (!surface) {
        surface = document.createElement("div");
        surface.id = "test-background";
        Object.assign(surface.style, {
          position: "fixed",
          inset: "0",
          zIndex: "100",
        });
        document.body.append(surface);
      }
      surface.style.background = background;
      window.dispatchEvent(new Event("scroll"));
    }, background);
    await expect(launcher).toHaveAttribute("data-surface-tone", tone);
    await expect(launcher).toHaveCSS("background-color", fill);
    await expect(launcher).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(
      await launcher
        .locator(".cw-launcher__icon")
        .evaluate((el) => el.outerHTML),
    ).toBe(iconBefore);
    expect(
      await launcher.evaluate((el) => getComputedStyle(el).boxShadow),
    ).toBe(shadowBefore);
  }
  await page.evaluate(() => {
    document.getElementById("test-background").remove();
    window.dispatchEvent(new Event("scroll"));
  });
}

for (const device of ["mobile", "desktop"]) {
  for (const mode of ["preview", "production assets"]) {
    test(`${device} ${mode} adapts only the green bubble fill`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport:
          device === "mobile"
            ? { width: 390, height: 844 }
            : { width: 1280, height: 800 },
        isMobile: device === "mobile",
        hasTouch: device === "mobile",
      });
      const page = await context.newPage();
      if (mode === "preview") {
        await page.goto("http://127.0.0.1:4173/?embed=1", {
          waitUntil: "networkidle",
        });
      } else {
        await page.setContent(
          `<!doctype html><html><head>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <link rel="stylesheet" href="http://127.0.0.1:4173/widget.css"/>
          </head><body><script src="http://127.0.0.1:4173/widget.js"></script></body></html>`,
          { waitUntil: "networkidle" },
        );
      }
      await verifyAdaptiveFill(page, page.getByTestId("widget-launcher"));
      await context.close();
    });
  }
}
