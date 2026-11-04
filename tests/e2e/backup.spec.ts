import { expect, test } from "@playwright/test";
import { buildLargeBackupPayload } from "./buildLargeBackupPayload";
import { cleanupE2eFixture } from "./cleanupE2eFixture";
import { createE2eAdminClient } from "./createE2eAdminClient";
import { dismissMessageBox } from "./dismissMessageBox";
import { loginAs } from "./loginAs";
import { seedE2eFixture, type E2eFixture } from "./seedE2eFixture";

// Phase 3 acceptance: a restore that actually crosses the old 1 MB Server
// Action limit, goes through the real console, and lands atomically with a
// snapshot and an audit trail. Unit tests cannot prove the transport path.
let fx: E2eFixture;

test.describe.serial("backup restore", () => {
  test.beforeAll(async () => {
    fx = await seedE2eFixture();
  });

  test.afterAll(async () => {
    if (fx) await cleanupE2eFixture(fx);
  });

  test("the owner restores a 5 MB backup through the console", async ({ page }) => {
    // Uploading, previewing and writing 110 rows is slower than a UI journey;
    // the default 60 s budget is not enough for a cold Next server.
    test.setTimeout(180_000);
    const payload = buildLargeBackupPayload({ schoolId: fx.schoolId, ownerId: fx.owner.id });
    const json = JSON.stringify(payload);
    const bytes = Buffer.byteLength(json);
    const rows = payload.tables.calendar_events?.length ?? 0;

    expect(bytes).toBeGreaterThan(5 * 1024 * 1024);
    expect(bytes).toBeLessThan(10 * 1024 * 1024);

    await loginAs(page, fx.owner);
    await page.goto("/en/settings/backup");

    await page.setInputFiles("#backup-file-input", {
      name: "large-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });

    const dialog = page.getByTestId("restore-confirm-dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await expect(dialog.getByTestId("restore-diff-added")).toHaveText(String(rows), {
      timeout: 60_000,
    });
    await expect(dialog.getByTestId("restore-diff-overwritten")).toHaveText("0");

    await dialog.getByRole("button", { name: "Proceed with Restore" }).click();
    await expect(dialog).toBeHidden({ timeout: 120_000 });
    await dismissMessageBox(page);

    const admin = createE2eAdminClient();
    await expect
      .poll(
        async () => {
          const { count } = await admin
            .from("calendar_events")
            .select("*", { count: "exact", head: true })
            .eq("school_id", fx.schoolId);
          return count ?? 0;
        },
        { timeout: 60_000 },
      )
      .toBe(rows);

    const snapshot = await admin
      .from("backup_snapshots")
      .select("id, reason, payload")
      .eq("school_id", fx.schoolId);
    expect(snapshot.data).toHaveLength(1);
    expect(snapshot.data?.[0]?.reason).toBe("pre-restore");
    expect(
      (snapshot.data?.[0]?.payload as { metadata?: { schoolId?: string } } | undefined)?.metadata
        ?.schoolId,
    ).toBe(fx.schoolId);

    const audit = await admin
      .from("audit_logs")
      .select("action")
      .eq("actor_id", fx.owner.id)
      .in("action", ["database.restore.start", "database.restore.success"]);
    expect(audit.data?.map((row) => row.action).sort()).toEqual([
      "database.restore.start",
      "database.restore.success",
    ]);
  });
});
