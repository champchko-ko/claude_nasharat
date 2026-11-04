import { expect, test } from "@playwright/test";
import { createE2eAdminClient } from "./createE2eAdminClient";
import { cleanupE2eFixture } from "./cleanupE2eFixture";
import { dismissMessageBox } from "./dismissMessageBox";
import { loginAs } from "./loginAs";
import { seedE2eFixture, type E2eFixture } from "./seedE2eFixture";

// The two primary workflows, driven through the UI with real sessions against
// the local stack. Before Phase 2 the create paths were broken by a revoked
// EXECUTE grant (finding B-4) and no gate could see it; these journeys are that
// gate.
let fx: E2eFixture;
let circularId = "";
let ticketId = "";

async function readTicketStatus(id: string): Promise<string | null> {
  const { data } = await createE2eAdminClient()
    .from("maintenance_requests")
    .select("status")
    .eq("id", id)
    .single();
  return data?.status ?? null;
}

test.describe.serial("primary workflows", () => {
  test.beforeAll(async () => {
    fx = await seedE2eFixture();
  });

  test.afterAll(async () => {
    if (fx) await cleanupE2eFixture(fx);
  });

  test("an administrator creates a circular with a school number", async ({ page }) => {
    await loginAs(page, fx.admin);
    await page.goto("/en/circulars/new");

    await page.locator("#title").fill("E2E circular");
    await page.locator("#body").fill("Body written by the end-to-end journey.");
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL(/\/en\/circulars\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    circularId = page.url().split("/").pop() ?? "";
    await expect(page.getByText(/CIR-\d{4}-\d{4}/).first()).toBeVisible();

    const { data } = await createE2eAdminClient()
      .from("circulars")
      .select("school_id, ref_number, created_by, status")
      .eq("id", circularId)
      .single();

    expect(data?.school_id).toBe(fx.schoolId);
    expect(data?.created_by).toBe(fx.admin.id);
    expect(data?.status).toBe("draft");
    expect(data?.ref_number).toMatch(/^CIR-\d{4}-\d{4}$/);
  });

  test("a staff member files a maintenance ticket with a school number", async ({ page }) => {
    await loginAs(page, fx.staff);
    await page.goto("/en/maintenance/new");

    await page.locator("#title").fill("E2E leaking tap");
    await page.locator("#description").fill("Water pooling under the sink.");
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL(/\/en\/maintenance\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    ticketId = page.url().split("/").pop() ?? "";
    await expect(page.getByText(/MR-\d{4}-\d{4}/).first()).toBeVisible();

    const { data } = await createE2eAdminClient()
      .from("maintenance_requests")
      .select("school_id, ticket_number, reporter_id, status")
      .eq("id", ticketId)
      .single();

    expect(data?.school_id).toBe(fx.schoolId);
    expect(data?.reporter_id).toBe(fx.staff.id);
    expect(data?.status).toBe("submitted");
    expect(data?.ticket_number).toMatch(/^MR-\d{4}-\d{4}$/);
  });

  test("the administrator assigns the ticket to the operator", async ({ page }) => {
    await loginAs(page, fx.admin);
    await page.goto(`/en/maintenance/${ticketId}`);

    await page.locator("#operator_id").selectOption({ label: fx.operator.fullName });
    await page.getByRole("button", { name: "Assign Operator" }).click();
    await dismissMessageBox(page);

    await expect
      .poll(
        async () => {
          const { data } = await createE2eAdminClient()
            .from("maintenance_assignments")
            .select("operator_id")
            .eq("request_id", ticketId)
            .eq("is_active", true);
          return data?.[0]?.operator_id ?? null;
        },
        { timeout: 30_000 },
      )
      .toBe(fx.operator.id);
  });

  test("the operator starts work and resolves the ticket", async ({ page }) => {
    await loginAs(page, fx.operator);
    await page.goto(`/en/maintenance/${ticketId}`);

    await page.getByRole("button", { name: "Start Work" }).click();
    await dismissMessageBox(page);
    await expect.poll(() => readTicketStatus(ticketId), { timeout: 30_000 }).toBe("in_progress");

    await page.getByRole("button", { name: "Mark Resolved" }).click();
    await page.locator("#reason").fill("Washer replaced and joint sealed.");
    await page.getByRole("button", { name: "Save" }).click();
    await dismissMessageBox(page);

    await expect.poll(() => readTicketStatus(ticketId), { timeout: 30_000 }).toBe("resolved");
  });
});
