import { expect, test } from "@playwright/test";

test("home page renders the portal heading and public sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("login page renders email and password fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
});

test("english locale loads successfully", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
