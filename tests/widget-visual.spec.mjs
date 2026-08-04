import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const output = "visual-artifacts";

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
});

async function openWidget(page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const launcher = page.getByTestId("widget-launcher");
  await expect(launcher).toBeVisible();
  await launcher.click();
  const panel = page.locator("#chameleon-widget-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByText("Čo mi to ušetrí?")).toBeVisible();
  await expect(page.getByText("WhatsApp")).toBeVisible();
  return panel;
}

test("mobile chat and configurator", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = await openWidget(page);
  await panel.screenshot({ path: `${output}/chat-mobile.png` });

  await page.getByTestId("tab-calculator").click();
  await expect(page.getByTestId("calculator-view")).toBeVisible();
  await page.waitForTimeout(260);
  await panel.screenshot({ path: `${output}/configurator-mobile.png` });
});

test("desktop chat", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const panel = await openWidget(page);
  await panel.screenshot({ path: `${output}/chat-desktop.png` });
});
