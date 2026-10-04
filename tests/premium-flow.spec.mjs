import { test, expect } from "@playwright/test";

async function openBuilder(page) {
  await page.goto("http://127.0.0.1:4173/?embed=1");
  await page.getByTestId("widget-launcher").click();
  await page.getByTestId("tab-calculator").click();
  await expect(page.getByTestId("interest-calcbot")).toBeVisible();
}

const next = async (page) => page.getByTestId("flow-next").click();
const back = async (page) => page.locator(".cw-progress__back").click();

test("combination asks for tools, preserves answers and sends the exact brief", async ({
  page,
}) => {
  let payload;
  await page.route("**/api/lead", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      json: { ok: true },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await openBuilder(page);
  await page.getByTestId("interest-calcbot").click();
  await expect(
    page.getByRole("heading", { name: "Ktoré riešenia chcete kombinovať?" }),
  ).toBeVisible();
  await expect(page.getByTestId("flow-next")).toBeDisabled();
  await page.getByTestId("solution-chatbot").click();
  await expect(page.getByTestId("flow-next")).toBeDisabled();
  await page.getByTestId("solution-calculator").click();
  await expect(page.getByTestId("flow-next")).toHaveCSS(
    "color",
    "rgb(16, 23, 19)",
  );
  await expect(page.getByTestId("flow-next").locator("span")).toHaveCSS(
    "-webkit-text-fill-color",
    "rgb(16, 23, 19)",
  );
  await next(page);
  await expect(page.getByTestId("feature-jazyky")).toBeVisible();
  await expect(page.getByTestId("feature-document")).toBeVisible();
  await expect(page.getByTestId("feature-viz-3d")).toHaveCount(0);
  await page.getByTestId("feature-document").click();
  await back(page);
  await expect(page.getByTestId("solution-chatbot")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("solution-calculator")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await next(page);
  await expect(page.getByTestId("feature-document")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await next(page);
  await expect(page.getByTestId("detail-chat-offer")).toBeVisible();
  await expect(page.getByTestId("detail-calc-dimensions-detail")).toBeVisible();
  await expect(page.getByTestId("detail-config-materials")).toHaveCount(0);
  await page.getByTestId("detail-chat-offer").click();
  await page.getByTestId("detail-calc-dimensions-detail").click();
  await next(page);
  await page.getByTestId("industry-sluzby").click();
  await page.getByTestId("timeline-mesiac").click();
  await expect(
    page.getByRole("heading", { name: "Váš návrh je pripravený" }),
  ).toBeVisible();
  await expect(page.getByText("Krok 7 z 7 · Kontakt")).toBeVisible();
  await page.getByTestId("lead-submit").click();
  await expect(page.getByRole("alert")).toContainText("meno");
  await page.getByPlaceholder("Vaše meno").fill("Test kombinácie");
  await page.getByPlaceholder("meno@firma.sk").fill("neplatny");
  await page.getByTestId("lead-submit").click();
  await expect(page.getByRole("alert")).toContainText("e-mail");
  await page.getByPlaceholder("meno@firma.sk").fill("review@example.invalid");
  await back(page);
  await expect(page.getByTestId("timeline-mesiac")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await next(page);
  await expect(page.getByPlaceholder("Vaše meno")).toHaveValue(
    "Test kombinácie",
  );
  await expect(page.getByPlaceholder("meno@firma.sk")).toHaveValue(
    "review@example.invalid",
  );
  await page.getByTestId("lead-submit").click();
  await expect(
    page.getByRole("heading", { name: "Ďakujem, Test kombinácie." }),
  ).toBeVisible();
  expect(payload.interest).toBe("Chatbot + Kalkulačka");
  expect(payload.features).toContain("Vytvoriť ponuku alebo PDF zhrnutie");
  expect(payload.features).toContain("Rozmery");
  expect(payload.email).toBe("review@example.invalid");
  expect(payload.reference).toMatch(/^MC-/);
});

test("changing selected tools prunes incompatible answers", async ({
  page,
}) => {
  await openBuilder(page);
  await page.getByTestId("interest-calcbot").click();
  await page.getByTestId("solution-chatbot").click();
  await page.getByTestId("solution-calculator").click();
  await next(page);
  await page.getByTestId("feature-jazyky").click();
  await next(page);
  await page.getByTestId("detail-chat-offer").click();
  await back(page);
  await back(page);
  await page.getByTestId("solution-chatbot").click();
  await page.getByTestId("solution-configurator").click();
  await next(page);
  await expect(page.getByTestId("feature-jazyky")).toHaveCount(0);
  await expect(page.getByTestId("feature-viz-3d")).toHaveCount(0);
  await next(page);
  await expect(page.getByTestId("detail-chat-offer")).toHaveCount(0);
  await expect(
    page.locator('[data-testid^="detail-"][data-selected="true"]'),
  ).toHaveCount(0);
});

for (const tool of ["advisor", "configurator"]) {
  test(`${tool} works alone and a failed delivery keeps a complete email fallback`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.route("**/api/lead", (route) =>
      route.fulfill({
        status: 503,
        json: { ok: false },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await openBuilder(page);
    await page.getByTestId(`interest-${tool}`).click();
    await expect(
      page.getByRole("heading", { name: "Ktoré doplnkové funkcie chcete?" }),
    ).toBeVisible();
    await expect(page.locator('[data-testid^="solution-"]')).toHaveCount(0);
    await next(page);
    await page.locator('[data-testid^="detail-"]').first().click();
    await next(page);
    await page.getByTestId("industry-eshop").click();
    await page.getByTestId("timeline-asap").click();
    await page.getByPlaceholder("Vaše meno").fill("Mobilná kontrola");
    await page.getByPlaceholder("+421 …").fill("+421900000000");
    await page.getByTestId("lead-submit").click();
    await expect(page.getByText("Skoro hotovo")).toBeVisible();
    const mail = page
      .locator('a[href^="mailto:"]')
      .filter({ hasText: "Otvoriť" });
    await expect(mail).toBeVisible();
    expect(decodeURIComponent(await mail.getAttribute("href"))).toContain(
      "+421900000000",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}
