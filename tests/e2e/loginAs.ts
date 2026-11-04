import type { Page } from "@playwright/test";
import type { E2eUser } from "./seedE2eFixture";

/**
 * Signs in through the real login form so the test exercises the same server
 * action and cookie handling a person does (no hand-forged session cookies).
 */
export async function loginAs(page: Page, user: E2eUser): Promise<void> {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/en\/dashboard/, { timeout: 30_000 });
}
