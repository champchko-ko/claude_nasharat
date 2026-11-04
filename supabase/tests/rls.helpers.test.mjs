import { createClient } from "@supabase/supabase-js";
import { purgeStaleFixtures } from "./purgeStaleFixtures.mjs";

export function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error(
      "Missing Supabase env. Run with `npm run test:rls` (local stack) — never point this at production.",
    );
  }
  // This battery writes fixtures, uploads objects and deletes rows. Refuse to
  // run against anything that is not the local stack, even if the env file
  // says otherwise.
  const host = new URL(url).hostname;
  if (!["127.0.0.1", "localhost", "::1", "0.0.0.0"].includes(host)) {
    throw new Error(
      `Refusing to run the destructive RLS battery against non-local host "${host}". ` +
        "Use `npm run test:rls`, which reads the local stack credentials.",
    );
  }
  return { url, anon, service };
}

export function makeAdmin(env) {
  return createClient(env.url, env.service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function makeAnon(env) {
  return createClient(env.url, env.anon, { auth: { persistSession: false } });
}

export async function signInAs(env, email, password) {
  const client = createClient(env.url, env.anon, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

const results = [];

export function check(label, pass, detail = "") {
  results.push({ label, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${pass || !detail ? "" : "  -- " + detail}`);
  return pass;
}

// A precondition that the fixture could not satisfy (for example: the database
// has no platform owner yet). It is reported explicitly and is NOT counted as
// a pass — otherwise a skipped assertion would silently inflate the score.
export function skip(label, reason = "") {
  console.log(`SKIP  ${label}${reason ? "  -- " + reason : ""}`);
}

export function summary() {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  return failed.length === 0;
}

export async function visibleCount(client, table) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) return { count: -1, error: error.message };
  return { count, error: null };
}

export async function expectDenied(label, fn) {
  const { data, error } = await fn();
  if (error) {
    check(label, true, error.message.slice(0, 70));
    return;
  }
  // PostgREST reports a denial by the RLS `using` clause as "0 rows affected"
  // with a 2xx status and NO error — a denied DELETE/UPDATE is indistinguishable
  // from a permitted one unless the affected rows are inspected. Callers must
  // chain `.select()` so the count is available; without it the outcome cannot
  // be verified and the assertion fails loudly rather than passing silently.
  const affected = Array.isArray(data) ? data.length : null;
  if (affected === null) {
    check(
      label,
      false,
      "cannot verify denial: the call must chain .select() to expose affected rows",
    );
    return;
  }
  if (affected === 0) {
    check(label, true, "denied by policy (0 rows affected)");
    return;
  }
  check(label, false, `operation was unexpectedly allowed (${affected} row(s) affected)`);
}

const PASSWORD = "Rls-Battery-2026!";

export async function seedFixture(admin) {
  const ts = Date.now();
  // An earlier aborted run may have left fixtures behind (see
  // purgeStaleFixtures.mjs); clear them so this run asserts against a known
  // database instead of inheriting someone else's leftovers.
  await purgeStaleFixtures(admin);
  const { data: school } = await admin
    .from("schools")
    .insert({ name_ar: "مدرسة الاختبار", name_en: "Battery School", slug: `rls-battery-${ts}` })
    .select()
    .single();
  await admin.from("school_settings").insert({ school_id: school.id });
  const { data: d1 } = await admin
    .from("departments")
    .insert({ school_id: school.id, name_ar: "تقنية المعلومات", name_en: "IT" })
    .select()
    .single();
  const { data: d2 } = await admin
    .from("departments")
    .insert({ school_id: school.id, name_ar: "الموارد البشرية", name_en: "HR" })
    .select()
    .single();
  const { data: school2 } = await admin
    .from("schools")
    .insert({ name_ar: "مدرسة ثانية", name_en: "Second School", slug: `rls-battery-2-${ts}` })
    .select()
    .single();
  const { data: d2school2 } = await admin
    .from("departments")
    .insert({ school_id: school2.id, name_ar: "عام", name_en: "General" })
    .select()
    .single();

  const { data: roles } = await admin.from("roles").select("id, key").eq("is_system", true);
  const roleIds = Object.fromEntries(roles.map((r) => [r.key, r.id]));

  // 0059 retired the seeded `auditor` system role. The read-only checks below
  // only need a role that grants audit.view + reports.view, so the fixture
  // builds its own school-scoped role instead of depending on the retired key.
  // Without this the "auditor" user would carry no role at all and the checks
  // would pass vacuously.
  if (!roleIds.auditor) {
    const { data: auditorRole, error: auditorRoleError } = await admin
      .from("roles")
      .insert({
        key: `battery-auditor-${ts}`,
        name: "Battery Auditor",
        school_id: school.id,
        is_system: false,
      })
      .select("id")
      .single();
    if (auditorRoleError) throw new Error(`create auditor role: ${auditorRoleError.message}`);

    const { error: auditorPermissionError } = await admin.from("role_permissions").insert([
      { role_id: auditorRole.id, permission_key: "audit.view" },
      { role_id: auditorRole.id, permission_key: "reports.view" },
    ]);
    if (auditorPermissionError) {
      throw new Error(`grant auditor permissions: ${auditorPermissionError.message}`);
    }

    roleIds.auditor = auditorRole.id;
  }

  const defs = [
    ["owner", "battery-owner", "owner", null, null],
    ["admin", "battery-admin", "school_admin", school.id, null],
    ["head", "battery-head", "department_head", school.id, d1.id],
    ["staff1", "battery-staff1", "staff", school.id, d1.id],
    ["staff2", "battery-staff2", "staff", school.id, d2.id],
    ["operator", "battery-operator", "operator", school.id, null],
    ["auditor", "battery-auditor", "auditor", school.id, null],
    ["disabled", "battery-disabled", "staff", school.id, d1.id],
    ["admin2", "battery-admin2", "school_admin", school2.id, null],
  ];
  const users = {};
  const creds = {};
  for (const [name, prefix, roleKey, schoolId, deptId] of defs) {
    const email = `${prefix}-${ts}@battery.local`;
    const { data: authData, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser ${name}: ${error.message}`);
    users[name] = { id: authData.user.id, email };
    creds[name] = { email, password: PASSWORD };
    await admin.from("profiles").insert({
      id: authData.user.id,
      full_name: name,
      email,
      school_id: schoolId,
      department_id: deptId,
      is_active: name !== "disabled",
    });
    if (roleKey) {
      await admin.from("user_role_assignments").insert({
        user_id: authData.user.id,
        role_id: roleIds[roleKey],
        school_id: schoolId,
        department_id: deptId,
      });
    }
  }

  const { data: c1 } = await admin
    .from("circulars")
    .insert({
      school_id: school.id,
      ref_number: `CIR-${ts}-1`,
      title: "C1 published for IT",
      body: "b",
      status: "published",
      publish_at: new Date().toISOString(),
      created_by: users.admin.id,
    })
    .select()
    .single();
  await admin
    .from("circular_targets")
    .insert({ circular_id: c1.id, school_id: school.id, department_id: d1.id });
  const { data: c2 } = await admin
    .from("circulars")
    .insert({
      school_id: school.id,
      ref_number: `CIR-${ts}-2`,
      title: "C2 draft for HR",
      body: "b",
      status: "draft",
      created_by: users.admin.id,
    })
    .select()
    .single();
  await admin
    .from("circular_targets")
    .insert({ circular_id: c2.id, school_id: school.id, department_id: d2.id });
  const { data: c3 } = await admin
    .from("circulars")
    .insert({
      school_id: school.id,
      ref_number: `CIR-${ts}-3`,
      title: "C3 published for HR",
      body: "b",
      status: "published",
      publish_at: new Date().toISOString(),
      created_by: users.admin.id,
    })
    .select()
    .single();
  await admin
    .from("circular_targets")
    .insert({ circular_id: c3.id, school_id: school.id, department_id: d2.id });

  const { data: mr1 } = await admin
    .from("maintenance_requests")
    .insert({
      school_id: school.id,
      ticket_number: `MR-${ts}-1`,
      title: "MR1 IT ticket",
      description: "d",
      reporter_id: users.staff1.id,
      reporter_department_id: d1.id,
      // Every RLS policy on `maintenance_requests` resolves the assigned
      // operator from this denormalised column — `maintenance_assignments` is
      // never consulted for authorization. Leaving it NULL makes the operator
      // unable to see their own ticket, which would silently invalidate the
      // operator assertions below.
      assigned_operator_id: users.operator.id,
    })
    .select()
    .single();
  const { data: mr2 } = await admin
    .from("maintenance_requests")
    .insert({
      school_id: school.id,
      ticket_number: `MR-${ts}-2`,
      title: "MR2 HR ticket",
      description: "d",
      reporter_id: users.staff2.id,
      reporter_department_id: d2.id,
    })
    .select()
    .single();
  await admin.from("maintenance_assignments").insert({
    request_id: mr1.id,
    school_id: school.id,
    operator_id: users.operator.id,
    assigned_by: users.admin.id,
  });
  await admin.from("maintenance_requests").update({ status: "assigned" }).eq("id", mr1.id);

  const now = new Date().toISOString();
  const later = new Date(Date.now() + 86400000).toISOString();
  await admin.from("calendar_events").insert({
    school_id: school.id,
    title_ar: "حفل الافتتاح",
    title_en: "Opening day",
    starts_at: now,
    ends_at: later,
    visibility: "public",
    status: "published",
    created_by: users.admin.id,
    published_at: now,
  });
  await admin.from("calendar_events").insert({
    school_id: school.id,
    title_ar: "اجتماع داخلي",
    starts_at: now,
    ends_at: later,
    visibility: "internal",
    status: "draft",
    created_by: users.admin.id,
  });

  await admin.from("notifications").insert({
    user_id: users.staff1.id,
    school_id: school.id,
    type: "circular_assigned",
    title: "C1 assigned",
  });

  // `roles.key` is a joined column: it can only be filtered when `roles` is
  // declared as an embedded resource. Without `!inner` PostgREST rejects the
  // request with PGRST108 ("'roles' is not an embedded resource in this
  // request") and returns no rows. maybeSingle() keeps the fixture working on
  // a database that has not been bootstrapped with a platform owner yet.
  const { data: ownerAssign } = await admin
    .from("user_role_assignments")
    .select("id, roles!inner(key)")
    .eq("roles.key", "owner")
    .is("school_id", null)
    .limit(1)
    .maybeSingle();
  const { data: auditRow } = await admin.from("audit_logs").select("id").limit(1).maybeSingle();

  return {
    schoolId: school.id,
    school2Id: school2.id,
    d1Id: d1.id,
    d2Id: d2.id,
    d2school2Id: d2school2.id,
    roleIds,
    users,
    creds,
    c1: c1.id,
    c2: c2.id,
    c3: c3.id,
    mr1: mr1.id,
    mr2: mr2.id,
    ownerAssignmentId: ownerAssign?.id ?? null,
    auditId: auditRow?.id ?? null,
  };
}

export async function cleanup(admin, fx) {
  const { error } = await admin.from("schools").delete().in("id", [fx.schoolId, fx.school2Id]);
  if (error) console.error("cleanup schools:", error.message);
  for (const u of Object.values(fx.users)) {
    const { error: e2 } = await admin.auth.admin.deleteUser(u.id);
    if (e2) console.error(`cleanup user ${u.email}:`, e2.message);
  }
}
