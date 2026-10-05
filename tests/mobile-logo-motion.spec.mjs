import { test, expect } from "@playwright/test";

test("launcher moves a highlight without changing logo width or geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const logo = page.getByTestId("widget-launcher").locator(".mc-mark");
  await expect(logo.locator("path")).toHaveCount(2);
  const samples = [];
  for (let i = 0; i < 4; i++) {
    samples.push(
      await logo.locator("path").evaluateAll((paths) =>
        paths.map((path) => ({
          width: getComputedStyle(path).strokeWidth,
          geometry: path.getAttribute("d"),
          dash: getComputedStyle(path).strokeDashoffset,
        })),
      ),
    );
    await page.waitForTimeout(250);
  }
  expect(new Set(samples.flat().map((sample) => sample.width)).size).toBe(1);
  expect(new Set(samples.flat().map((sample) => sample.geometry)).size).toBe(1);
  expect(new Set(samples.map((sample) => sample[1].dash)).size).toBeGreaterThan(
    1,
  );
});

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

test("embedded widget stylesheet preserves host link hover and body styles", async ({ page }) => {
  await page.route("http://127.0.0.1:4173/host-style-test", route => route.fulfill({
    contentType: "text/html",
    body: '<!doctype html><html><head><style>body{margin:17px;background:rgb(20,30,40);color:rgb(240,230,220);font-family:serif}a{color:rgb(250,240,230)}a:hover{color:rgb(220,200,180)}</style></head><body><a href="#test">Host navigation</a><script src="/widget.js"></script></body></html>'
  }));
  await page.goto("http://127.0.0.1:4173/host-style-test", { waitUntil: "networkidle" });
  await expect(page.getByTestId("widget-launcher")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("margin", "17px");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 30, 40)");
  const link = page.getByRole("link", { name: "Host navigation" });
  await expect(link).toHaveCSS("color", "rgb(250, 240, 230)");
  await link.hover();
  await expect(link).toHaveCSS("color", "rgb(220, 200, 180)");
});
