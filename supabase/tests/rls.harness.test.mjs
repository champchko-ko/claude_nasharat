// Negative control for the RLS battery harness.
//
// The battery asserts that certain operations are DENIED. If `expectDenied`
// could only ever report success, the whole battery would pass while proving
// nothing. This suite performs the mirror image: operations that ARE allowed,
// and asserts that the harness reports each one as a failure.
//
// Run: node --env-file=.env.local supabase/tests/rls.harness.test.mjs
import {
  cleanup,
  expectDenied,
  getEnv,
  makeAdmin,
  seedFixture,
  signInAs,
  summary,
} from "./rls.helpers.test.mjs";

const env = getEnv();
const admin = makeAdmin(env);
let fx;
let ok = true;

try {
  fx = await seedFixture(admin);
  const adminC = await signInAs(env, fx.creds.admin.email, fx.creds.admin.password);

  // The school admin holds `users.manage`, so deleting another user's
  // school-scoped assignment is permitted by RLS and by the integrity
  // trigger. `expectDenied` MUST report this as a failure.
  const { data: other } = await admin
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", fx.users.staff2.id)
    .maybeSingle();

  await expectDenied("control: admin deleting another user's assignment is allowed", () =>
    adminC.from("user_role_assignments").delete().eq("id", other.id).select("id"),
  );

  // The school admin holds `maintenance.close`, so raising the priority on a
  // school ticket is permitted. `expectDenied` MUST report this as a failure.
  await expectDenied("control: admin updating a school ticket is allowed", () =>
    adminC
      .from("maintenance_requests")
      .update({ priority: "urgent" })
      .eq("id", fx.mr1)
      .select("id"),
  );

  // Both controls are EXPECTED to fail. A passing control means the harness
  // reported a permitted operation as denied — the gate is then vacuous.
  ok = summary();
  if (ok) {
    console.error(
      "\nHARNESS IS VACUOUS: expectDenied never reported a failure. The RLS battery cannot be trusted.",
    );
    process.exit(1);
  }
  console.log("\nHarness validated: it reports permitted operations as failures.");
} finally {
  if (fx) await cleanup(admin, fx);
}
