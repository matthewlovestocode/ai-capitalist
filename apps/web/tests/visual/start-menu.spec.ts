import { expect, test } from "@playwright/test";

test.describe("start menu", () => {
  test("shows the splash screen menu before gameplay starts", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel("AI Capitalist start menu")).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Capitalist" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Game/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Options/i })).toBeVisible();

    const backgroundImage = await page.locator(".start-menu").evaluate((element) =>
      window.getComputedStyle(element).backgroundImage
    );

    expect(backgroundImage).toContain("ai-capitalist-job-killer-hero.webp");
  });

  test("enters the playable game from the splash screen", async ({ page }) => {
    await page.goto("/");
    const startButton = page.getByRole("button", { name: /Start Game/i });

    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page.getByRole("navigation", { name: "Top navigation" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Capitalist" })).toBeVisible();
    await expect(page.getByText(/Cash/i)).toBeVisible();
    await expect(page.locator(".venture-art").first()).toBeVisible();

    await page.waitForFunction(() =>
      [...document.querySelectorAll("img")]
        .filter((image) => {
          const rect = image.getBoundingClientRect();
          return rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth;
        })
        .every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)
    );
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test("shows Zusk capacity and layoff programs in the upgrades drawer", async ({ page }) => {
    await page.goto("/?drawer=upgrades");
    const startButton = page.getByRole("button", { name: /Start Game/i });

    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page.getByRole("dialog", { name: "Zusk Levers" })).toBeVisible();
    await expect(page.getByText("Zusk capacity").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Layoff Programs" })).toBeVisible();
    await expect(page.getByText("Support Triage Reduction")).toBeVisible();
  });
});
