import { createE2eAdminClient } from "./createE2eAdminClient";
import type { E2eFixture } from "./seedE2eFixture";

/**
 * Removes the fixture school (child rows cascade) and its auth users.
 *
 * Errors are reported instead of thrown: a cleanup failure must not turn a
 * passing journey into a red run, but it does leave rows behind, so it has to
 * be visible in the output.
 */
export async function cleanupE2eFixture(fx: E2eFixture): Promise<void> {
  const admin = createE2eAdminClient();

  // Snapshots hold a full export of the school; delete them before the school,
  // because `school_id` becomes null on cascade and the row can no longer be
  // matched to this fixture.
  const { error: snapshotError } = await admin
    .from("backup_snapshots")
    .delete()
    .eq("school_id", fx.schoolId);
  if (snapshotError) console.error("E2E cleanup: snapshots:", snapshotError.message);

  const { error: schoolError } = await admin.from("schools").delete().eq("id", fx.schoolId);
  if (schoolError) console.error("E2E cleanup: school:", schoolError.message);

  for (const user of [fx.owner, fx.admin, fx.staff, fx.operator]) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) console.error(`E2E cleanup: user ${user.email}:`, error.message);
  }
}
