import { test, expect } from "@playwright/test";

for (const device of ["mobile", "desktop"]) {
  for (const mode of ["direct", "iframe"]) {
    test(`${device} ${mode} adapts launcher fill and logo to the page`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport:
          device === "mobile"
            ? { width: 390, height: 844 }
            : { width: 1280, height: 800 },
        isMobile: device === "mobile",
        hasTouch: device === "mobile",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      // Serve a real parent origin, so iframe bridge origin checks remain active.
      await page.route("http://127.0.0.1:4173/surface-test", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><section style="height:100vh;background:#1c1612"></section><section style="height:100vh;background:#fffcf7"></section><script src="/${mode === "iframe" ? "embed" : "widget"}.js"></script></body></html>`,
        }),
      );
      await page.goto("http://127.0.0.1:4173/surface-test", {
        waitUntil: "networkidle",
      });
      const surface =
        mode === "iframe" ? page.frameLocator("#site-assistant-frame") : page;
      const launcher = surface.getByTestId("widget-launcher");
      await expect(launcher).toBeVisible();
      await expect(launcher).toHaveAttribute("data-surface", "dark");
      await expect(launcher).toHaveCSS(
        "background-color",
        "rgb(255, 252, 247)",
      );
      await expect(launcher).toHaveCSS("color", "rgb(91, 58, 38)");
      const path = launcher.locator(".mc-mark path").first();
      await expect(path).toHaveCSS("animation-name", "none");
      await expect(path).toHaveCSS("stroke", "rgb(91, 58, 38)");
      await page.evaluate(() => scrollTo(0, innerHeight));
      await expect(launcher).toHaveAttribute("data-surface", "light");
      await expect(launcher).toHaveCSS("background-color", "rgb(28, 22, 18)");
      await expect(launcher).toHaveCSS("color", "rgb(255, 252, 247)");
      await launcher.click();
      await expect(surface.locator(".cw-panel")).toBeVisible();
      await expect(surface.locator(".cw-panel-head")).toHaveCSS(
        "background-color",
        "rgb(28, 22, 18)",
      );
      await context.close();
    });
  }
}
