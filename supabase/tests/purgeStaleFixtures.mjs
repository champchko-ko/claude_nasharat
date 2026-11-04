// Removes fixtures left behind by an aborted RLS run.
//
// `seedFixture` inserts schools and auth users before it returns, so a failure
// in the middle of seeding (for example the auth gateway returning 502 while
// the local stack restarts) leaves rows behind: `seedFixture` throws, the
// caller's `finally` sees no fixture object, and nothing is cleaned up. The
// next run then asserts against a polluted database and fails for the wrong
// reason.
//
// Only this suite's own namespace is touched: schools whose slug starts with
// `rls-battery` and auth users whose address ends with `@battery.local`.
export async function purgeStaleFixtures(admin) {
  const { data: staleSchools, error: schoolError } = await admin
    .from("schools")
    .select("id")
    .like("slug", "rls-battery%");

  if (schoolError) {
    throw new Error(`Could not list stale fixture schools: ${schoolError.message}`);
  }

  for (const school of staleSchools ?? []) {
    const { error } = await admin.from("schools").delete().eq("id", school.id);
    if (error) {
      throw new Error(`Could not delete stale fixture school ${school.id}: ${error.message}`);
    }
  }

  // Auth users are not children of `schools`, so they survive the cascade.
  // Always re-read page 1: deleting shifts the pages, and the loop is bounded
  // by the number of fixture users actually present.
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) {
      throw new Error(`Could not list stale fixture users: ${error.message}`);
    }

    const staleUsers = data.users.filter((user) => (user.email ?? "").endsWith("@battery.local"));
    if (staleUsers.length === 0) break;

    for (const user of staleUsers) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        throw new Error(`Could not delete stale fixture user ${user.id}: ${deleteError.message}`);
      }
    }
  }
}
