import { expect, type Page } from "@playwright/test";

/**
 * Dismisses the app's message box.
 *
 * `initMessageBoxBridge` replaces `toast.success`/`toast.error` with
 * `showMessageBox`, so every successful server action ends in a blocking,
 * `aria-modal` dialog. A test that clicks "Start Work" and then looks for the
 * next button without closing this box waits on a click that can never land.
 */
export async function dismissMessageBox(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole("button", { name: "OK" }).click();
  await expect(dialog).toBeHidden();
}
