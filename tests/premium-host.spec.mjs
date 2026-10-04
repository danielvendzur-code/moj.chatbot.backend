import { test, expect } from "@playwright/test";

const home = process.env.PREMIUM_WEB_ORIGIN || "http://127.0.0.1:3000";

test("desktop hero, FAQ keyboard controls, comparison and CTA work together", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(home, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Odmietnuť analytiku" }).click();
  await expect(page.locator("#top img")).toHaveCount(3);
  await expect(page.locator("#pred-a-po article")).toHaveCount(2);
  await expect(page.locator(".redesign-cursor")).toHaveCount(0);
  expect(
    await page.locator("#top").evaluate((el) => getComputedStyle(el).cursor),
  ).toContain("pixel-arrow.svg");
  const button = page.locator(".redesign-nav-cta");
  await expect(button).toHaveCSS("background-color", "rgb(200, 240, 106)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(16, 23, 19)");
  const faq = page.locator("#faq button").nth(1);
  await faq.focus();
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-answer-1")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("#faq button").first()).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.keyboard.press("Space");
  await expect(faq).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
  await expect(page.locator(".cw-chat-builder")).toHaveCount(0);
});

test("mobile navigation closes with Escape and outside click, touch keeps native cursor", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(home, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Odmietnuť analytiku" }).click();
  const toggle = page.locator(".redesign-menu-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.mouse.click(10, 620);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.locator("#top").evaluate((el) => getComputedStyle(el).cursor),
  ).not.toContain("pixel-arrow.svg");
  const hero = await page.locator("#top").boundingBox();
  const cta = await page
    .locator("#top")
    .getByRole("link", { name: "Vybrať riešenie" })
    .boundingBox();
  expect(cta.y + cta.height).toBeLessThanOrEqual(hero.y + hero.height + 1);
  await page
    .locator("#top")
    .getByRole("link", { name: "Vybrať riešenie" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.locator("#top").getByRole("link", { name: "Vybrať riešenie" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.locator("#top").screenshot({
    path: "/workspace/redesign-review/after/hero-short-360.png",
  });
  await context.close();
});

test("public routes render at desktop and mobile widths without overflow or runtime errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/sluzby",
      "/projekty",
      "/postup",
      "/cennik",
      "/3d-konfigurator",
      "/nastroj?t=poradca",
      "/kontakt",
      "/ochrana-udajov",
    ]) {
      const response = await page.goto(home + route, {
        waitUntil: "networkidle",
      });
      expect(response.status(), route).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        `${route} at ${width}`,
      ).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});
