// WP2 RLS/authorization battery (build_plan.md WP2 gate; doc §9 Phase 2).
// Run: node --env-file=.env.local supabase/tests/rls.battery.test.mjs
// Seeds two schools with per-role users, then asserts visibility and
// denial behavior through the real API with real sessions.
import { randomUUID } from "node:crypto";
import {
  check,
  cleanup,
  expectDenied,
  getEnv,
  makeAdmin,
  makeAnon,
  seedFixture,
  signInAs,
  skip,
  summary,
  visibleCount,
} from "./rls.helpers.test.mjs";

const env = getEnv();
const admin = makeAdmin(env);
let fx;

try {
  fx = await seedFixture(admin);
  const anon = makeAnon(env);
  const ts = Date.now();

  // -- Anonymous: deny by default -----------------------------------------
  check("anon sees no circulars", (await visibleCount(anon, "circulars")).count === 0);
  check("anon sees no audit logs", (await visibleCount(anon, "audit_logs")).count === 0);
  check("anon sees no schools", (await visibleCount(anon, "schools")).count === 0);
  check("anon sees no school_settings", (await visibleCount(anon, "school_settings")).count === 0);
  check(
    "anon can read the public school profile view (N6)",
    (await visibleCount(anon, "public_school_profiles")).count === 2,
  );
  check("anon sees no profiles", (await visibleCount(anon, "profiles")).count === 0);
  check("anon sees no notifications", (await visibleCount(anon, "notifications")).count === 0);
  check(
    "anon sees exactly the one public published event",
    (await visibleCount(anon, "calendar_events")).count === 1,
  );
  await expectDenied("anon cannot create a maintenance request", () =>
    anon
      .from("maintenance_requests")
      .insert({
        school_id: fx.schoolId,
        title: "x",
        description: "x",
        reporter_id: fx.users.staff1.id,
      })
      .select("id"),
  );

  // -- C1: the app's owner-existence query must return a usable count ------
  const ownerProbe = await admin
    .from("user_role_assignments")
    .select("id, roles!inner(key)", { count: "exact", head: true })
    .eq("roles.key", "owner");
  check(
    "owner-existence query returns a usable count (C1)",
    !ownerProbe.error && typeof ownerProbe.count === "number",
    ownerProbe.error?.message ?? `count=${ownerProbe.count}`,
  );

  // -- Sessions ------------------------------------------------------------
  const adminC = await signInAs(env, fx.creds.admin.email, fx.creds.admin.password);
  const headC = await signInAs(env, fx.creds.head.email, fx.creds.head.password);
  const staffC = await signInAs(env, fx.creds.staff1.email, fx.creds.staff1.password);
  const staff2C = await signInAs(env, fx.creds.staff2.email, fx.creds.staff2.password);
  const opC = await signInAs(env, fx.creds.operator.email, fx.creds.operator.password);
  const audC = await signInAs(env, fx.creds.auditor.email, fx.creds.auditor.password);
  const disabledC = await signInAs(env, fx.creds.disabled.email, fx.creds.disabled.password);
  const admin2C = await signInAs(env, fx.creds.admin2.email, fx.creds.admin2.password);
  const ownerC = await signInAs(env, fx.creds.owner.email, fx.creds.owner.password);

  // -- School admin --------------------------------------------------------
  check("admin sees all three circulars", (await visibleCount(adminC, "circulars")).count === 3);
  check("admin reads the school audit trail", (await visibleCount(adminC, "audit_logs")).count > 0);
  check("admin sees school profiles", (await visibleCount(adminC, "profiles")).count === 7);
  check(
    "admin cannot read platform system_settings",
    (await visibleCount(adminC, "system_settings")).count === 0,
  );
  if (fx.ownerAssignmentId) {
    await expectDenied("admin cannot delete the platform owner assignment", () =>
      adminC.from("user_role_assignments").delete().eq("id", fx.ownerAssignmentId).select("id"),
    );
  } else {
    skip("admin cannot delete the platform owner assignment", "no platform owner exists");
  }
  // A system role's permission matrix is platform configuration. The fixture's
  // read-only role is now school-scoped (0059 retired the seeded auditor), and a
  // school administrator may legitimately manage permissions on school roles,
  // so target a system role to keep the original assertion intact.
  await expectDenied("admin cannot write the permission matrix", () =>
    adminC
      .from("role_permissions")
      .insert({ role_id: fx.roleIds.staff, permission_key: "circular.publish" })
      .select("role_id"),
  );

  await expectDenied("admin cannot grant a role to a user outside the school", () =>
    adminC
      .from("user_role_assignments")
      .insert({
        user_id: fx.users.admin2.id,
        role_id: fx.roleIds.school_admin,
      })
      .select("id"),
  );

  // -- Platform owner: escalation + lockout guards (H6/H2/N4) --------------
  await expectDenied("owner cannot demote the last platform owner", () =>
    ownerC
      .from("user_role_assignments")
      .update({ role_id: fx.roleIds.school_admin })
      .eq("id", fx.ownerAssignmentId)
      .select("id"),
  );
  await expectDenied("owner cannot deactivate the last platform owner", () =>
    ownerC.from("profiles").update({ is_active: false }).eq("id", fx.users.owner.id).select("id"),
  );
  await expectDenied("non-owner cannot call bootstrap_platform_owner", () =>
    staffC.rpc("bootstrap_platform_owner", { p_user_id: fx.users.staff1.id }),
  );

  // -- Department head: targeting + cross-department isolation -------------
  check(
    "head sees only targeted published C1",
    (await visibleCount(headC, "circulars")).count === 1,
  );
  const resp = await headC
    .from("circular_responses")
    .insert({
      circular_id: fx.c1,
      school_id: fx.schoolId,
      department_id: fx.d1Id,
      responder_id: fx.users.head.id,
      response_type: "acknowledgement",
      status: "acknowledged",
    })
    .select("id");
  check(
    "head responds for own department",
    !resp.error && (resp.data ?? []).length === 1,
    resp.error?.message,
  );
  await expectDenied("head cannot respond for another department", () =>
    headC
      .from("circular_responses")
      .insert({
        circular_id: fx.c3,
        school_id: fx.schoolId,
        department_id: fx.d2Id,
        responder_id: fx.users.head.id,
        response_type: "acknowledgement",
      })
      .select("id"),
  );
  await expectDenied("head cannot respond to a circular they are not targeted for", () =>
    headC
      .from("circular_responses")
      .insert({
        circular_id: fx.c2,
        school_id: fx.schoolId,
        department_id: fx.d1Id,
        responder_id: fx.users.head.id,
        response_type: "acknowledgement",
      })
      .select("id"),
  );
  await expectDenied("head cannot forge a response for another department", () =>
    headC
      .from("circular_responses")
      .insert({
        circular_id: fx.c1,
        school_id: fx.schoolId,
        department_id: fx.d2Id,
        responder_id: fx.users.head.id,
        response_type: "acknowledgement",
      })
      .select("id"),
  );
  check(
    "head sees only own response (no identities)",
    (await visibleCount(headC, "circular_responses")).count === 1,
  );
  check(
    "head sees own-department maintenance only",
    (await visibleCount(headC, "maintenance_requests")).count === 1,
  );

  // -- Staff: least privilege ----------------------------------------------
  check(
    "staff sees only targeted published C1",
    (await visibleCount(staffC, "circulars")).count === 1,
  );
  check(
    "staff sees own maintenance ticket only",
    (await visibleCount(staffC, "maintenance_requests")).count === 1,
  );
  await expectDenied("staff cannot respond to circulars", () =>
    staffC
      .from("circular_responses")
      .insert({
        circular_id: fx.c1,
        school_id: fx.schoolId,
        department_id: fx.d1Id,
        responder_id: fx.users.staff1.id,
        response_type: "acknowledgement",
      })
      .select("id"),
  );
  await expectDenied("staff cannot move their own ticket status", () =>
    staffC
      .from("maintenance_requests")
      .update({ status: "reopened", reopen_reason: "still broken" })
      .eq("id", fx.mr1)
      .select("id"),
  );
  await expectDenied("staff cannot change ticket priority", () =>
    staffC
      .from("maintenance_requests")
      .update({ priority: "urgent" })
      .eq("id", fx.mr1)
      .select("id"),
  );
  await expectDenied("staff cannot grant themselves a role", () =>
    staffC
      .from("user_role_assignments")
      .insert({
        user_id: fx.users.staff1.id,
        role_id: fx.roleIds.school_admin,
      })
      .select("id"),
  );
  await expectDenied("staff cannot create a pre-closed ticket", () =>
    staffC
      .from("maintenance_requests")
      .insert({
        school_id: fx.schoolId,
        ticket_number: `MR-preclosed-${Date.now()}`,
        title: "x",
        description: "x",
        reporter_id: fx.users.staff1.id,
        reporter_department_id: fx.d1Id,
        status: "closed",
      })
      .select("id"),
  );
  await expectDenied("staff cannot create a pre-assigned ticket", () =>
    staffC
      .from("maintenance_requests")
      .insert({
        school_id: fx.schoolId,
        ticket_number: `MR-preassigned-${Date.now()}`,
        title: "x",
        description: "x",
        reporter_id: fx.users.staff1.id,
        reporter_department_id: fx.d1Id,
        assigned_operator_id: fx.users.operator.id,
      })
      .select("id"),
  );
  await expectDenied("reporter cannot escalate priority while reopening", () =>
    staffC
      .from("maintenance_requests")
      .update({ status: "reopened", reopen_reason: "x", priority: "urgent" })
      .eq("id", fx.mr1)
      .select("id"),
  );
  await expectDenied("reporter cannot relocate their ticket while reopening", () =>
    staffC
      .from("maintenance_requests")
      .update({ status: "reopened", reopen_reason: "x", school_id: fx.school2Id })
      .eq("id", fx.mr1)
      .select("id"),
  );

  // -- Operator: assigned tickets and legal transitions only ---------------
  check(
    "operator sees the assigned ticket",
    (await visibleCount(opC, "maintenance_requests")).count === 1,
  );
  const started = await opC
    .from("maintenance_requests")
    .update({ status: "in_progress" })
    .eq("id", fx.mr1)
    .select("id, status");
  check(
    "operator moves assigned ticket to in_progress",
    !started.error && (started.data ?? []).length === 1 && started.data[0].status === "in_progress",
    started.error?.message,
  );
  await expectDenied("operator cannot skip to closed", () =>
    opC.from("maintenance_requests").update({ status: "closed" }).eq("id", fx.mr1).select("id"),
  );
  const note = await opC
    .from("maintenance_updates")
    .insert({
      request_id: fx.mr1,
      school_id: fx.schoolId,
      author_id: fx.users.operator.id,
      kind: "note",
      new_value: "working on it",
    })
    .select("id");
  check(
    "operator adds a work note",
    !note.error && (note.data ?? []).length === 1,
    note.error?.message,
  );
  await expectDenied("operator cannot touch another department's ticket", () =>
    opC
      .from("maintenance_updates")
      .insert({
        request_id: fx.mr2,
        school_id: fx.schoolId,
        author_id: fx.users.operator.id,
        kind: "note",
        new_value: "x",
      })
      .select("id"),
  );
  await expectDenied("operator cannot change the ticket priority", () =>
    opC.from("maintenance_requests").update({ priority: "urgent" }).eq("id", fx.mr1).select("id"),
  );
  const resolved = await opC
    .from("maintenance_requests")
    .update({ status: "resolved" })
    .eq("id", fx.mr1)
    .select("id, status");
  check(
    "operator resolves the in-progress ticket",
    !resolved.error && (resolved.data ?? []).length === 1 && resolved.data[0].status === "resolved",
    resolved.error?.message,
  );
  const reopened = await staffC
    .from("maintenance_requests")
    .update({ status: "reopened", reopen_reason: "still broken" })
    .eq("id", fx.mr1)
    .select("id, status");
  check(
    "reporter can reopen their own resolved ticket",
    !reopened.error && (reopened.data ?? []).length === 1 && reopened.data[0].status === "reopened",
    reopened.error?.message,
  );

  // -- Auditor: read-only ---------------------------------------------------
  check("auditor reads the audit trail", (await visibleCount(audC, "audit_logs")).count > 0);
  check(
    "auditor reads all maintenance (reports.view)",
    (await visibleCount(audC, "maintenance_requests")).count === 2,
  );
  check(
    "auditor sees no circular responses",
    (await visibleCount(audC, "circular_responses")).count === 0,
  );
  if (fx.auditId) {
    await expectDenied("auditor cannot edit audit logs", () =>
      audC.from("audit_logs").update({ action: "tampered" }).eq("id", fx.auditId).select("id"),
    );
  } else {
    skip("auditor cannot edit audit logs", "no audit rows were written");
  }

  // -- Disabled user: data access revoked ----------------------------------
  check(
    "disabled user sees no circulars despite targeting",
    (await visibleCount(disabledC, "circulars")).count === 0,
  );
  check(
    "disabled user sees no maintenance tickets",
    (await visibleCount(disabledC, "maintenance_requests")).count === 0,
  );
  await expectDenied("disabled user cannot re-enable themselves", () =>
    disabledC
      .from("profiles")
      .update({ is_active: true })
      .eq("id", fx.users.disabled.id)
      .select("id"),
  );
  await expectDenied("disabled user cannot rewrite their own department", () =>
    disabledC
      .from("profiles")
      .update({ department_id: fx.d2Id })
      .eq("id", fx.users.disabled.id)
      .select("id"),
  );

  // -- Self-service profile scope (H4) -------------------------------------
  await expectDenied("staff cannot rewrite their own department", () =>
    staffC
      .from("profiles")
      .update({ department_id: fx.d2Id })
      .eq("id", fx.users.staff1.id)
      .select("id"),
  );
  const selfEdit = await staffC
    .from("profiles")
    .update({ full_name: "Renamed Staff" })
    .eq("id", fx.users.staff1.id)
    .select("id");
  check(
    "staff can still edit their own display name",
    !selfEdit.error && (selfEdit.data ?? []).length === 1,
    selfEdit.error?.message,
  );

  // -- Cross-school isolation -----------------------------------------------
  check(
    "school-2 admin sees no school-1 circulars",
    (await visibleCount(admin2C, "circulars")).count === 0,
  );
  check(
    "school-2 admin sees no school-1 maintenance",
    (await visibleCount(admin2C, "maintenance_requests")).count === 0,
  );
  check(
    "school-2 admin sees only own school profiles",
    (await visibleCount(admin2C, "profiles")).count === 1,
  );
  await expectDenied("admin2 cannot point a target at another school's circular", () =>
    admin2C
      .from("circular_targets")
      .insert({ circular_id: fx.c1, school_id: fx.school2Id, department_id: fx.d2school2Id })
      .select("id"),
  );
  await expectDenied("admin2 cannot attach to another school's circular", () =>
    admin2C
      .from("circular_attachments")
      .insert({
        circular_id: fx.c1,
        school_id: fx.school2Id,
        path: `foreign/${Date.now()}.pdf`,
        uploaded_by: fx.users.admin2.id,
      })
      .select("id"),
  );
  await expectDenied("admin2 cannot assign onto another school's ticket", () =>
    admin2C
      .from("maintenance_assignments")
      .insert({
        request_id: fx.mr1,
        school_id: fx.school2Id,
        operator_id: fx.users.admin2.id,
        assigned_by: fx.users.admin2.id,
      })
      .select("id"),
  );
  await expectDenied("admin2 cannot add a work note to another school's ticket", () =>
    admin2C
      .from("maintenance_updates")
      .insert({
        request_id: fx.mr1,
        school_id: fx.school2Id,
        author_id: fx.users.admin2.id,
        kind: "note",
        new_value: "x",
      })
      .select("id"),
  );

  // -- H1: privileged helpers are not callable by anon or end users ---------
  const anonOwner = await anon.rpc("has_any_owner");
  check(
    "anon cannot call has_any_owner (H1)",
    Boolean(anonOwner.error),
    anonOwner.error?.message ?? "no error",
  );
  const anonNumber = await anon.rpc("generate_school_number", {
    p_school: fx.schoolId,
    p_kind: "MR",
  });
  check(
    "anon cannot call generate_school_number (H1)",
    Boolean(anonNumber.error),
    anonNumber.error?.message ?? "no error",
  );
  const staffOwner = await staffC.rpc("has_any_owner");
  check(
    "staff cannot call has_any_owner (H1)",
    Boolean(staffOwner.error),
    staffOwner.error?.message ?? "no error",
  );
  const staffNumber = await staffC.rpc("generate_school_number", {
    p_school: fx.schoolId,
    p_kind: "MR",
  });
  check(
    "staff cannot call generate_school_number (H1)",
    Boolean(staffNumber.error),
    staffNumber.error?.message ?? "no error",
  );
  const staffMember = await staffC.rpc("is_school_member", { p_school: fx.schoolId });
  check(
    "staff can still call the policy helper is_school_member (H1)",
    !staffMember.error && staffMember.data === true,
    staffMember.error?.message ?? `data=${staffMember.data}`,
  );

  // -- B-4: document numbering is reachable again, but only through the ------
  // checked wrapper. The raw generator stays closed to end users (asserted
  // above); these four checks cover the wrapper's contract.
  const anonNext = await anon.rpc("next_school_number", {
    p_school: fx.schoolId,
    p_kind: "circular",
  });
  check(
    "anon cannot call next_school_number (B-4)",
    Boolean(anonNext.error),
    anonNext.error?.message ?? "no error",
  );

  const staffCircularNumber = await staffC.rpc("next_school_number", {
    p_school: fx.schoolId,
    p_kind: "circular",
  });
  check(
    "staff without circular.create cannot allocate a circular number (B-4)",
    Boolean(staffCircularNumber.error),
    staffCircularNumber.error?.message ?? `data=${staffCircularNumber.data}`,
  );

  const staffTicketNumber = await staffC.rpc("next_school_number", {
    p_school: fx.schoolId,
    p_kind: "maintenance",
  });
  check(
    "staff can allocate a maintenance number (B-4)",
    !staffTicketNumber.error && String(staffTicketNumber.data).startsWith("MR-"),
    staffTicketNumber.error?.message ?? `data=${staffTicketNumber.data}`,
  );

  const adminCircularNumber = await adminC.rpc("next_school_number", {
    p_school: fx.schoolId,
    p_kind: "circular",
  });
  check(
    "a school admin can allocate a circular number (B-4)",
    !adminCircularNumber.error && String(adminCircularNumber.data).startsWith("CIR-"),
    adminCircularNumber.error?.message ?? `data=${adminCircularNumber.data}`,
  );

  const foreignNumber = await staffC.rpc("next_school_number", {
    p_school: fx.school2Id,
    p_kind: "maintenance",
  });
  check(
    "a staff member cannot allocate a number in another school (B-4)",
    Boolean(foreignNumber.error),
    foreignNumber.error?.message ?? `data=${foreignNumber.data}`,
  );

  const badKind = await adminC.rpc("next_school_number", {
    p_school: fx.schoolId,
    p_kind: "invoice",
  });
  check(
    "an unsupported document kind is rejected (B-4)",
    Boolean(badKind.error),
    badKind.error?.message ?? `data=${badKind.data}`,
  );

  // -- N12: department-scoped roles hold their school-scoped permissions -----
  const staffPerm = await staffC.rpc("has_permission", {
    p_permission: "maintenance.create",
    p_school: fx.schoolId,
  });
  check(
    "department-scoped staff holds maintenance.create (N12)",
    !staffPerm.error && staffPerm.data === true,
    staffPerm.error?.message ?? `data=${staffPerm.data}`,
  );
  const staffPermOther = await staffC.rpc("has_permission", {
    p_permission: "maintenance.create",
    p_school: fx.school2Id,
  });
  check(
    "staff holds no permission in another school (N12)",
    !staffPermOther.error && staffPermOther.data === false,
    staffPermOther.error?.message ?? `data=${staffPermOther.data}`,
  );
  const staffPermWrongDept = await staffC.rpc("has_permission", {
    p_permission: "maintenance.create",
    p_school: fx.schoolId,
    p_department: fx.d2Id,
  });
  check(
    "a mismatched department does not grant the permission (N12)",
    !staffPermWrongDept.error && staffPermWrongDept.data === false,
    staffPermWrongDept.error?.message ?? `data=${staffPermWrongDept.data}`,
  );

  // -- N5: the system-role catalog is readable by role managers -------------
  // The system catalog no longer contains `auditor` (0059), and `owner` is
  // deliberately hidden from non-owners by roles_select, so assert the keys a
  // school administrator is supposed to see instead of a raw row count.
  const adminCatalog = await adminC.from("roles").select("key").eq("is_system", true);
  const visibleSystemKeys = (adminCatalog.data ?? []).map((row) => row.key);
  check(
    "a school admin can read the system role catalog (N5)",
    ["department_head", "operator", "school_admin", "staff"].every((key) =>
      visibleSystemKeys.includes(key),
    ),
    adminCatalog.error?.message ?? `keys=${visibleSystemKeys.join(",")}`,
  );
  const staffRoles = await visibleCount(staffC, "roles");
  check(
    "staff cannot read the role catalog (N5)",
    staffRoles.count === 0,
    `count=${staffRoles.count}`,
  );

  // F15/0062: the fixture owner has only the global owner assignment (no
  // school-scoped row). Membership must still hold, otherwise every
  // membership-gated read returns nothing and the dashboard looks empty.
  const ownerDepartments = await ownerC
    .from("departments")
    .select("id")
    .eq("school_id", fx.schoolId);
  check(
    "the platform owner reads departments without a school-scoped assignment (F15)",
    !ownerDepartments.error && (ownerDepartments.data ?? []).length > 0,
    ownerDepartments.error?.message ?? `count=${(ownerDepartments.data ?? []).length}`,
  );

  // -- 0040: authorization hardening regressions ----------------------------
  // B-1: the reserved-key trigger used to fire on UPDATE only, so a school
  // admin could insert their own `owner` row and be treated as platform owner.
  await expectDenied("admin cannot insert a school-scoped role keyed owner (B-1)", () =>
    adminC
      .from("roles")
      .insert({
        key: "owner",
        name_ar: "مالك مزور",
        name_en: "Forged Owner",
        is_system: false,
      })
      .select("id"),
  );
  // With role management owner-only (0061), the admin attempt above is denied by
  // RLS before the reserved-key trigger can speak. Exercise the trigger with the
  // owner, who is allowed to create roles.
  await expectDenied("even the owner cannot insert a school-scoped role keyed owner (B-1)", () =>
    ownerC
      .from("roles")
      .insert({
        key: "owner",
        name_ar: "مالك مزور",
        name_en: "Forged Owner",
        is_system: false,
      })
      .select("id"),
  );
  const ownerRow = await adminC.from("roles").select("id").eq("key", "owner");
  check(
    "the owner role row is hidden from the manager catalog (B-1)",
    (ownerRow.data ?? []).length === 0,
    ownerRow.error?.message ?? `rows=${(ownerRow.data ?? []).length}`,
  );
  await expectDenied("admin cannot assign the system owner role at school scope (B-1)", () =>
    adminC
      .from("user_role_assignments")
      .insert({
        user_id: fx.users.admin.id,
        role_id: fx.roleIds.owner,
        assigned_by: fx.users.admin.id,
      })
      .select("id"),
  );

  // B-3: a manager could move their own profile to another tenant and then
  // read that tenant's staff directory through the service-role client.
  await expectDenied("a manager cannot move their own profile to another school (B-3)", () =>
    adminC
      .from("profiles")
      .update({ school_id: fx.school2Id })
      .eq("id", fx.users.admin.id)
      .select("id"),
  );
  const { data: adminAfter } = await admin
    .from("profiles")
    .select("school_id")
    .eq("id", fx.users.admin.id)
    .single();
  check(
    "the manager's school is unchanged after the attempt (B-3)",
    adminAfter?.school_id === fx.schoolId,
    `school=${adminAfter?.school_id}`,
  );

  // H-10 + 0061: role permissions are owner-only now, so a school administrator
  // can attach nothing to a role. The platform owner still can, and
  // platform-only keys stay out of school roles.
  const { data: customRole } = await admin
    .from("roles")
    .insert({
      key: `custom-${ts}`,
      name_ar: "دور مخصص",
      name_en: "Custom Role",
      is_system: false,
    })
    .select("id")
    .single();
  await expectDenied("admin cannot grant settings.platform.update to a school role (H-10)", () =>
    adminC
      .from("role_permissions")
      .insert({ role_id: customRole.id, permission_key: "settings.platform.update" })
      .select("role_id"),
  );
  await expectDenied("admin cannot grant any permission to a school role (0061)", () =>
    adminC
      .from("role_permissions")
      .insert({ role_id: customRole.id, permission_key: "circular.create" })
      .select("role_id"),
  );
  const ownerGrant = await ownerC
    .from("role_permissions")
    .insert({ role_id: customRole.id, permission_key: "circular.create" })
    .select("role_id");
  check(
    "the platform owner can still grant an ordinary permission to a school role (0061)",
    !ownerGrant.error && (ownerGrant.data ?? []).length === 1,
    ownerGrant.error?.message ?? "",
  );

  // H-11: circular.create alone must not publish or archive.
  const { data: creatorRole } = await admin
    .from("roles")
    .insert({
      key: `circular-creator-${ts}`,
      name_ar: "منشئ التعميم",
      name_en: "Circular Creator",
      is_system: false,
    })
    .select("id")
    .single();
  await admin
    .from("role_permissions")
    .insert({ role_id: creatorRole.id, permission_key: "circular.create" });
  await admin.from("user_role_assignments").insert({
    user_id: fx.users.staff1.id,
    role_id: creatorRole.id,
    assigned_by: fx.users.admin.id,
  });

  await expectDenied("a circular.create-only role cannot publish on update (H-11)", () =>
    staffC.from("circulars").update({ status: "published" }).eq("id", fx.c2).select("id"),
  );
  await expectDenied("a circular.create-only role cannot insert a published circular (M-6)", () =>
    staffC
      .from("circulars")
      .insert({
        school_id: fx.schoolId,
        ref_number: `CIR-${ts}-bypass`,
        title: "Bypass",
        body: "b",
        status: "published",
        created_by: fx.users.staff1.id,
      })
      .select("id"),
  );

  // H-11: the `created_by = auth.uid()` shortcut is gone, so a demoted author
  // cannot keep editing their old circular.
  const { data: demotedCircular } = await admin
    .from("circulars")
    .insert({
      school_id: fx.schoolId,
      ref_number: `CIR-${ts}-demoted`,
      title: "Demoted author",
      body: "b",
      status: "draft",
      created_by: fx.users.staff2.id,
    })
    .select("id")
    .single();
  await expectDenied("a demoted creator cannot update their old circular (H-11)", () =>
    staff2C
      .from("circulars")
      .update({ title: "Hijacked" })
      .eq("id", demotedCircular.id)
      .select("id"),
  );

  // D-2: `roles.manage` keeps the catalog but no longer implies user or role
  // assignment, and a role manager cannot edit a role they hold themselves.
  const { data: rolesOnlyRole } = await admin
    .from("roles")
    .insert({
      key: `roles-only-${ts}`,
      name_ar: "الأدوار فقط",
      name_en: "Roles Only",
      is_system: false,
    })
    .select("id")
    .single();
  await admin
    .from("role_permissions")
    .insert({ role_id: rolesOnlyRole.id, permission_key: "roles.manage" });
  await admin.from("user_role_assignments").insert({
    user_id: fx.users.staff2.id,
    role_id: rolesOnlyRole.id,
    assigned_by: fx.users.admin.id,
  });
  await expectDenied("a roles.manage-only user cannot assign roles (D-2)", () =>
    staff2C
      .from("user_role_assignments")
      .insert({
        user_id: fx.users.staff2.id,
        role_id: fx.roleIds.school_admin,
        assigned_by: fx.users.staff2.id,
      })
      .select("id"),
  );
  await expectDenied("a role manager cannot add permissions to their own role (H-10)", () =>
    staff2C
      .from("role_permissions")
      .insert({ role_id: rolesOnlyRole.id, permission_key: "users.manage" })
      .select("role_id"),
  );

  // -- H7/N7: structural + workflow changes are audited ---------------------
  const { data: auditMr, error: auditMrErr } = await staffC
    .from("maintenance_requests")
    .insert({
      school_id: fx.schoolId,
      ticket_number: `MR-${Date.now()}-audit`,
      title: "audit probe",
      description: "d",
      reporter_id: fx.users.staff1.id,
    })
    .select("id")
    .single();
  check(
    "staff can create a request for the audit probe (setup)",
    Boolean(auditMr?.id),
    auditMrErr?.message ?? "",
  );
  const { data: insertAudit } = await admin
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "maintenance_requests")
    .eq("entity_id", auditMr?.id ?? "00000000-0000-0000-0000-000000000000")
    .eq("action", "maintenance_requests.insert");
  check("a new request is audited (N7)", (insertAudit ?? []).length === 1);

  const { error: prioErr } = await adminC
    .from("maintenance_requests")
    .update({ priority: "urgent" })
    .eq("id", fx.mr2);
  check(
    "admin can change a request priority for the audit probe (setup)",
    !prioErr,
    prioErr?.message ?? "",
  );
  const { data: updateAudit } = await admin
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "maintenance_requests")
    .eq("entity_id", fx.mr2)
    .eq("action", "maintenance_requests.update");
  check("a priority change is audited (N7)", (updateAudit ?? []).length >= 1);

  const { data: probeSchool } = await admin
    .from("schools")
    .insert({
      name_ar: "مدرسة الاختبار",
      name_en: "Audit Probe School",
      slug: `audit-${Date.now()}`,
    })
    .select("id")
    .single();
  const { error: delErr } = await admin.from("schools").delete().eq("id", probeSchool.id);
  check("probe school can be deleted (setup)", !delErr, delErr?.message ?? "");
  const { data: schoolAudit } = await admin
    .from("audit_logs")
    .select("action, metadata")
    .eq("entity_type", "schools")
    .eq("entity_id", probeSchool.id)
    .in("action", ["schools.insert", "schools.delete"]);
  const schoolActions = new Set((schoolAudit ?? []).map((r) => r.action));
  check(
    "school create + delete are audited (H7)",
    schoolActions.has("schools.insert") && schoolActions.has("schools.delete"),
    `actions=${[...schoolActions].join(",")}`,
  );
  const schoolDeleteRow = (schoolAudit ?? []).find((r) => r.action === "schools.delete");
  check(
    "a deleted school keeps its name in the audit trail (H7)",
    schoolDeleteRow?.metadata?.school_name_en === "Audit Probe School",
    `meta=${JSON.stringify(schoolDeleteRow?.metadata ?? null).slice(0, 60)}`,
  );

  // -- H3/N10: attachment reads follow the entity audience ------------------
  // 0045 binds maintenance objects to `<school>/<request>/<file>`, so the
  // upload must use the request the reporter owns.
  const objectPath = `${fx.schoolId}/${fx.mr1}/probe-${Date.now()}.jpg`;
  const { error: upErr } = await staffC.storage
    .from("maintenance-photos")
    .upload(objectPath, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: "image/jpeg" });
  check("reporter can upload a maintenance photo (setup)", !upErr, upErr?.message ?? "");
  const { error: regErr } = await staffC
    .from("maintenance_attachments")
    .insert({
      request_id: fx.mr1,
      school_id: fx.schoolId,
      path: objectPath,
      uploaded_by: fx.users.staff1.id,
    })
    .select("id");
  check("reporter can register the attachment (setup)", !regErr, regErr?.message ?? "");
  const selfSign = await staffC.storage.from("maintenance-photos").createSignedUrl(objectPath, 60);
  check(
    "reporter can read their own attachment (H3)",
    !selfSign.error,
    selfSign.error?.message ?? "",
  );
  const otherSign = await staff2C.storage
    .from("maintenance-photos")
    .createSignedUrl(objectPath, 60);
  check(
    "an unrelated user cannot read the attachment (H3/N10)",
    Boolean(otherSign.error) || !otherSign.data?.signedUrl,
    otherSign.error?.message ?? "a signed url was issued",
  );

  // -- IDOR: guessed IDs across departments ---------------------------------
  const idor = await staff2C.from("maintenance_requests").select("*").eq("id", fx.mr1);
  check("foreign ticket not fetchable by id", (idor.data ?? []).length === 0);
  const respIdor = await staff2C.from("circular_responses").select("*").eq("circular_id", fx.c1);
  check("foreign department responses not listable", (respIdor.data ?? []).length === 0);

  // -- 0042: restore is owner-only and all-or-nothing -----------------------
  const restoreArgs = (tables, actor, school = fx.schoolId) => ({
    p_tables: tables,
    p_scope: "school",
    p_school: school,
    p_actor: actor,
  });

  const anonRestore = await anon.rpc("restore_backup", restoreArgs({}, fx.users.owner.id));
  check(
    "anon cannot execute restore_backup (0042)",
    Boolean(anonRestore.error),
    anonRestore.error?.message ?? "call succeeded",
  );

  const sessionRestore = await adminC.rpc("restore_backup", restoreArgs({}, fx.users.owner.id));
  check(
    "an authenticated user cannot execute restore_backup directly (0042)",
    Boolean(sessionRestore.error),
    sessionRestore.error?.message ?? "call succeeded",
  );

  const anonAuthUsers = await anon.rpc("restore_backup_auth_users", { p_profiles: [] });
  check(
    "anon cannot create auth users through the restore helper (0042)",
    Boolean(anonAuthUsers.error),
    anonAuthUsers.error?.message ?? "call succeeded",
  );

  const notOwner = await admin.rpc(
    "restore_backup",
    restoreArgs(
      {
        departments: [
          { id: randomUUID(), school_id: fx.schoolId, name_ar: "قسم", name_en: "Not owner" },
        ],
      },
      fx.users.admin.id,
    ),
  );
  check(
    "a school admin cannot act as the restore owner (0042)",
    Boolean(notOwner.error) && /platform owner/i.test(notOwner.error.message),
    notOwner.error?.message ?? "call succeeded",
  );

  const foreignRow = await admin.rpc(
    "restore_backup",
    restoreArgs(
      {
        departments: [
          { id: randomUUID(), school_id: fx.school2Id, name_ar: "خارجي", name_en: "Foreign" },
        ],
      },
      fx.users.owner.id,
    ),
  );
  check(
    "restore rejects a row from another school (0042)",
    Boolean(foreignRow.error) && /outside the restore target/i.test(foreignRow.error.message),
    foreignRow.error?.message ?? "call succeeded",
  );

  const unknownTable = await admin.rpc(
    "restore_backup",
    restoreArgs({ students: [] }, fx.users.owner.id),
  );
  check(
    "restore rejects a table outside the backup contract (0042)",
    Boolean(unknownTable.error) && /restore contract/i.test(unknownTable.error.message),
    unknownTable.error?.message ?? "call succeeded",
  );

  const rollbackDeptId = randomUUID();
  const rollback = await admin.rpc(
    "restore_backup",
    restoreArgs(
      {
        departments: [
          { id: rollbackDeptId, school_id: fx.schoolId, name_ar: "قسم", name_en: "Rollback" },
        ],
        circulars: [
          {
            id: randomUUID(),
            school_id: fx.schoolId,
            ref_number: `ROLLBACK-${ts}`,
            title: "invalid status",
            body: "x",
            status: "not_a_status",
            created_by: fx.users.admin.id,
          },
        ],
      },
      fx.users.owner.id,
    ),
  );
  check("restore fails on an invalid row (0042)", Boolean(rollback.error), rollback.error?.message);
  const survivors = await admin.from("departments").select("id").eq("id", rollbackDeptId);
  check(
    "a failed restore rolls back the tables it already wrote (C-3)",
    (survivors.data ?? []).length === 0,
    `${(survivors.data ?? []).length} row(s) survived`,
  );

  const restoredDeptId = randomUUID();
  const restored = await admin.rpc(
    "restore_backup",
    restoreArgs(
      {
        departments: [
          {
            id: restoredDeptId,
            school_id: fx.schoolId,
            name_ar: "قسم مستعاد",
            name_en: "Restored Dept",
          },
        ],
      },
      fx.users.owner.id,
    ),
  );
  check(
    "restore_backup writes a school-scoped row (0042)",
    !restored.error && restored.data?.totalRecords === 1,
    restored.error?.message ?? `total=${restored.data?.totalRecords}`,
  );
  const restoredRow = await admin
    .from("departments")
    .select("name_en")
    .eq("id", restoredDeptId)
    .maybeSingle();
  check("the restored row is present (0042)", restoredRow.data?.name_en === "Restored Dept");
  const restoreAudit = await admin
    .from("audit_logs")
    .select("id")
    .eq("entity_id", restoredDeptId)
    .eq("action", "departments.insert");
  check(
    "the restore is recorded in the audit trail (M-18)",
    (restoreAudit.data ?? []).length > 0,
    restoreAudit.error?.message ?? "no audit row",
  );

  const overwrite = await admin.rpc(
    "restore_backup",
    restoreArgs(
      {
        departments: [
          {
            id: restoredDeptId,
            school_id: fx.schoolId,
            name_ar: "قسم محدث",
            name_en: "Restored Dept v2",
          },
        ],
      },
      fx.users.owner.id,
    ),
  );
  const overwrittenRow = await admin
    .from("departments")
    .select("name_en")
    .eq("id", restoredDeptId)
    .maybeSingle();
  check(
    "restore overwrites an existing row instead of duplicating it (0042)",
    !overwrite.error && overwrittenRow.data?.name_en === "Restored Dept v2",
    overwrite.error?.message ?? "",
  );

  const placeholderId = randomUUID();
  const placeholder = await admin.rpc("restore_backup", {
    p_tables: {
      profiles: [
        {
          id: placeholderId,
          full_name: "Placeholder probe",
          email: `placeholder-${ts}@battery.local`,
          school_id: fx.schoolId,
          is_active: true,
        },
      ],
    },
    p_scope: "platform",
    p_school: null,
    p_actor: fx.users.owner.id,
  });
  check(
    "restore creates the auth users that profiles depend on (0042)",
    !placeholder.error && placeholder.data?.authUsersCreated === 1,
    placeholder.error?.message ?? `created=${placeholder.data?.authUsersCreated}`,
  );
  const placeholderAuth = await admin.auth.admin.getUserById(placeholderId);
  check(
    "the reconciled account is a real auth user with one email identity (0042)",
    !placeholderAuth.error && placeholderAuth.data?.user?.identities?.length === 1,
    placeholderAuth.error?.message ??
      `identities=${placeholderAuth.data?.user?.identities?.length ?? 0}`,
  );
  await admin.auth.admin.deleteUser(placeholderId);

  const snapshot = await admin
    .from("backup_snapshots")
    .insert({
      school_id: fx.schoolId,
      created_by: fx.users.owner.id,
      reason: "battery",
      payload: { tables: {} },
    })
    .select("id")
    .single();
  const adminSnapshots = await adminC.from("backup_snapshots").select("id");
  check(
    "a school admin cannot read pre-restore snapshots (0042)",
    (adminSnapshots.data ?? []).length === 0,
    adminSnapshots.error?.message ?? "",
  );
  const ownerSnapshots = await ownerC.from("backup_snapshots").select("id");
  check(
    "the platform owner can read pre-restore snapshots (0042)",
    (ownerSnapshots.data ?? []).length === 1,
    ownerSnapshots.error?.message ?? `count=${(ownerSnapshots.data ?? []).length}`,
  );
  if (snapshot.data) await admin.from("backup_snapshots").delete().eq("id", snapshot.data.id);

  // -- Phase 5: storage hardening and dissociation guards -------------------
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

  // 5.1: the bucket is the last line of defence; the app checks can be bypassed
  // by calling the Storage API directly.
  const svgUpload = await adminC.storage
    .from("public-assets")
    .upload(`${fx.schoolId}/calendar/svg-${ts}.svg`, new Uint8Array([0x3c, 0x73, 0x76, 0x67]), {
      contentType: "image/svg+xml",
      upsert: false,
    });
  check(
    "public-assets rejects SVG at the bucket (H-18)",
    Boolean(svgUpload.error),
    svgUpload.error?.message ?? "the upload succeeded",
  );

  // 5.2: a calendar manager may write only the calendar folder.
  const { data: calendarRole } = await admin
    .from("roles")
    .insert({
      key: `calendar-only-${ts}`,
      name_ar: "التقويم فقط",
      name_en: "Calendar Only",
      is_system: false,
    })
    .select("id")
    .single();
  await admin
    .from("role_permissions")
    .insert({ role_id: calendarRole.id, permission_key: "calendar.manage" });
  await admin.from("user_role_assignments").insert({
    user_id: fx.users.staff2.id,
    role_id: calendarRole.id,
    assigned_by: fx.users.admin.id,
  });

  const calendarPath = `${fx.schoolId}/calendar/cal-${ts}.png`;
  const calendarUpload = await staff2C.storage
    .from("public-assets")
    .upload(calendarPath, pngBytes, { contentType: "image/png" });
  check(
    "a calendar manager can upload a calendar image (setup)",
    !calendarUpload.error,
    calendarUpload.error?.message ?? "",
  );

  const logoSneak = await staff2C.storage
    .from("public-assets")
    .upload(`${fx.schoolId}/logo/sneak-${ts}.png`, pngBytes, { contentType: "image/png" });
  check(
    "a calendar manager cannot write the logo folder (H-17)",
    Boolean(logoSneak.error),
    logoSneak.error?.message ?? "the upload succeeded",
  );

  // 5.2: the object must belong to a real parent row in that school.
  const parentless = await adminC.storage
    .from("circular-attachments")
    .upload(`${fx.schoolId}/${randomUUID()}/probe-${ts}.pdf`, pdfBytes, {
      contentType: "application/pdf",
    });
  check(
    "a circular attachment must point at a real circular (5.2)",
    Boolean(parentless.error),
    parentless.error?.message ?? "the upload succeeded",
  );

  // 5.3: DELETE policies + the app's remove() calls can actually delete.
  const deleteProbePath = `${fx.schoolId}/${fx.c1}/delete-${ts}.pdf`;
  const deleteProbeUpload = await adminC.storage
    .from("circular-attachments")
    .upload(deleteProbePath, pdfBytes, { contentType: "application/pdf" });
  check(
    "a circular manager can upload to their circular (setup)",
    !deleteProbeUpload.error,
    deleteProbeUpload.error?.message ?? "",
  );
  // The storage SELECT policy resolves the object through this row (0024);
  // without it Storage cannot list the object and a delete removes nothing.
  await admin.from("circular_attachments").insert({
    circular_id: fx.c1,
    school_id: fx.schoolId,
    path: deleteProbePath,
    uploaded_by: fx.users.admin.id,
  });

  const foreignDelete = await staff2C.storage
    .from("circular-attachments")
    .remove([deleteProbePath]);
  // The service-role client bypasses storage RLS, so the listing is a real
  // existence check rather than another policy evaluation.
  const folderListing = await admin.storage
    .from("circular-attachments")
    .list(`${fx.schoolId}/${fx.c1}`);
  const objectStillExists = (folderListing.data ?? []).some(
    (entry) => entry.name === `delete-${ts}.pdf`,
  );
  check(
    "an unrelated user cannot delete a circular attachment (H-16)",
    (Boolean(foreignDelete.error) || (foreignDelete.data ?? []).length === 0) && objectStillExists,
    foreignDelete.error?.message ?? "the object disappeared",
  );

  const ownDelete = await adminC.storage.from("circular-attachments").remove([deleteProbePath]);
  check(
    "a circular manager can delete the stored object (H-16)",
    !ownDelete.error && (ownDelete.data ?? []).length === 1,
    ownDelete.error?.message ?? `removed=${(ownDelete.data ?? []).length}`,
  );

  // 5.6: only users.manage is needed to attempt a dissociation; the guard must
  // reject removing the school's only administrator.
  const { data: userManagerRole } = await admin
    .from("roles")
    .insert({
      key: `user-manager-${ts}`,
      name_ar: "مدير المستخدمين",
      name_en: "User Manager",
      is_system: false,
    })
    .select("id")
    .single();
  await admin
    .from("role_permissions")
    .insert({ role_id: userManagerRole.id, permission_key: "users.manage" });
  await admin.from("user_role_assignments").insert({
    user_id: fx.users.head.id,
    role_id: userManagerRole.id,
    assigned_by: fx.users.admin.id,
  });

  const lastAdminProbe = await headC.rpc("is_last_active_school_admin", {
    p_user_id: fx.users.admin.id,
  });
  check(
    "is_last_active_school_admin identifies the sole administrator (M-10)",
    lastAdminProbe.data === true,
    lastAdminProbe.error?.message ?? `value=${lastAdminProbe.data}`,
  );
  const nonAdminProbe = await headC.rpc("is_last_active_school_admin", {
    p_user_id: fx.users.staff1.id,
  });
  check(
    "is_last_active_school_admin is false for a non-administrator (M-10)",
    nonAdminProbe.data === false,
    nonAdminProbe.error?.message ?? `value=${nonAdminProbe.data}`,
  );

  const blockedDissociation = await headC.rpc("dissociate_school_user", {
    p_user_id: fx.users.admin.id,
  });
  check(
    "the last active school administrator cannot be removed (M-10)",
    Boolean(blockedDissociation.error) &&
      /last active school administrator/.test(blockedDissociation.error?.message ?? ""),
    blockedDissociation.error?.message ?? "the rpc succeeded",
  );

  const leaverEmail = `battery-leaver-${ts}@battery.local`;
  const { data: leaverAuth } = await admin.auth.admin.createUser({
    email: leaverEmail,
    password: "Rls-Battery-2026!",
    email_confirm: true,
  });
  await admin.from("profiles").insert({
    id: leaverAuth.user.id,
    full_name: "Leaver",
    email: leaverEmail,
    school_id: fx.schoolId,
    is_active: true,
  });
  await admin.from("user_role_assignments").insert({
    user_id: leaverAuth.user.id,
    role_id: fx.roleIds.staff,
    assigned_by: fx.users.admin.id,
  });
  fx.users.leaver = { id: leaverAuth.user.id, email: leaverEmail };

  const dissociated = await headC.rpc("dissociate_school_user", {
    p_user_id: leaverAuth.user.id,
  });
  const { data: leaverProfile } = await admin
    .from("profiles")
    .select("school_id, department_id, is_active")
    .eq("id", leaverAuth.user.id)
    .single();
  const { count: leaverAssignments } = await admin
    .from("user_role_assignments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", leaverAuth.user.id);
  check(
    "dissociation deactivates and detaches the user (M-10)",
    !dissociated.error &&
      leaverProfile?.school_id === null &&
      leaverProfile?.is_active === false &&
      leaverAssignments === 0,
    dissociated.error?.message ??
      `school=${leaverProfile?.school_id} active=${leaverProfile?.is_active} roles=${leaverAssignments}`,
  );

  const activeLeaverEmail = `battery-active-leaver-${ts}@battery.local`;
  const { data: activeLeaverAuth } = await admin.auth.admin.createUser({
    email: activeLeaverEmail,
    password: "Rls-Battery-2026!",
    email_confirm: true,
  });
  await admin.from("profiles").insert({
    id: activeLeaverAuth.user.id,
    full_name: "Active Leaver",
    email: activeLeaverEmail,
    school_id: fx.schoolId,
    is_active: true,
  });
  fx.users.activeLeaver = { id: activeLeaverAuth.user.id, email: activeLeaverEmail };

  const activeLeave = await headC
    .from("profiles")
    .update({ school_id: null })
    .eq("id", activeLeaverAuth.user.id);
  check(
    "a profile cannot leave a school while still active (M-10)",
    Boolean(activeLeave.error) && /must be deactivated/.test(activeLeave.error?.message ?? ""),
    activeLeave.error?.message ?? "the update succeeded",
  );

  // 5.6/0047: the database does not support dissociation through a plain
  // PATCH — the SELECT policy rejects a row without a school — so the guarded
  // RPC is the only path (proved above by "dissociation deactivates and
  // detaches the user").
  const directLeave = await headC
    .from("profiles")
    .update({ school_id: null, department_id: null, is_active: false })
    .eq("id", activeLeaverAuth.user.id);
  const { data: activeLeaverAfter } = await admin
    .from("profiles")
    .select("school_id, is_active")
    .eq("id", activeLeaverAuth.user.id)
    .single();
  check(
    "a direct profile update cannot detach a user (dissociation is RPC-only, M-10)",
    Boolean(directLeave.error) &&
      activeLeaverAfter?.school_id === fx.schoolId &&
      activeLeaverAfter?.is_active === true,
    directLeave.error?.message ?? JSON.stringify(activeLeaverAfter),
  );

  // -- 0048/0049: regression guards for this batch -------------------------
  // The zero-argument form must resolve to exactly one function. Before 0048
  // the school-scoped overload left `effective_permission_keys()` ambiguous,
  // and the application's permission load silently degraded to "no
  // permissions" for every non-owner.
  const { data: allPerms, error: allPermsErr } = await adminC.rpc("effective_permission_keys");
  check(
    "effective_permission_keys() resolves to a single function (0048)",
    !allPermsErr && Array.isArray(allPerms) && allPerms.length > 0,
    allPermsErr?.message ?? `n=${allPerms?.length ?? 0}`,
  );

  // School scoping (M10): the admin holds a School-1 assignment only, so asking
  // for School 2 must return nothing.
  const { data: otherSchoolPerms, error: otherPermsErr } = await adminC.rpc(
    "effective_permission_keys",
    { p_school: fx.school2Id },
  );
  check(
    "effective_permission_keys(school) excludes another school's keys (M10)",
    !otherPermsErr && Array.isArray(otherSchoolPerms) && otherSchoolPerms.length === 0,
    otherPermsErr?.message ?? `n=${otherSchoolPerms?.length ?? 0}`,
  );

  // 0036 stays in force: nothing in the application writes `file_metadata`, and
  // 0048 must not re-open the member-writable policy.
  await expectDenied("a school member cannot insert file_metadata (0036)", () =>
    staffC
      .from("file_metadata")
      .insert({
        school_id: fx.schoolId,
        bucket: "maintenance-photos",
        path: `${fx.schoolId}/forged/file.png`,
        owner_id: fx.users.staff1.id,
        purpose: "report",
      })
      .select("id"),
  );

  // `roles.key` is globally unique, so a school-scoped role cannot shadow a
  // system key and capture circulars targeted at it. The policy allows this
  // insert (valid key domain, caller holds roles.manage), so the rejection has
  // to come from the unique index itself: code 23505.
  // 0061: creating roles is owner-only. A school administrator is denied before
  // the unique index can speak, so the shadowing test runs as the owner.
  await expectDenied("a school admin cannot create a role (0061)", () =>
    adminC
      .from("roles")
      .insert({
        name_ar: "دور أنشأه المدير",
        name_en: "Admin made role",
        key: `admin-made-${ts}`,
        is_system: false,
      })
      .select("id"),
  );

  const { error: shadowErr } = await ownerC
    .from("roles")
    .insert({
      name_ar: "نسخة الموظف",
      name_en: "Staff clone",
      key: "staff",
      is_system: false,
    })
    .select("id");
  check(
    "a role cannot shadow the system key 'staff' (N11)",
    shadowErr?.code === "23505",
    shadowErr?.message ?? "the insert succeeded",
  );

  // Positive control: a genuinely new key is still allowed.
  const newKey = `battery-new-${ts}`;
  const { data: newRole, error: newRoleErr } = await ownerC
    .from("roles")
    .insert({
      name_ar: "دور جديد للاختبار",
      name_en: "Battery new role",
      key: newKey,
      is_system: false,
    })
    .select("id")
    .single();
  check(
    "a genuinely new role key is still allowed (N11)",
    !newRoleErr && Boolean(newRole?.id),
    newRoleErr?.message ?? "inserted",
  );
  if (newRole?.id) await admin.from("roles").delete().eq("id", newRole.id);

  // `circular_targets.role_key` must stay inside the seeded domain.
  const { error: badRoleKeyErr } = await admin
    .from("circular_targets")
    .insert({ circular_id: fx.c1, school_id: fx.schoolId, role_key: "not-a-role" })
    .select("id");
  check(
    "circular_targets rejects an unknown role_key (N11)",
    Boolean(badRoleKeyErr) && badRoleKeyErr.code === "23514",
    badRoleKeyErr?.message ?? "the insert succeeded",
  );

  // 0049: a response may only be attributed to a department the responder
  // actually holds. A fresh circular keeps the positive control independent of
  // the acknowledgement the head already recorded above.
  const { data: c4 } = await admin
    .from("circulars")
    .insert({
      school_id: fx.schoolId,
      ref_number: `CIR-${ts}-4`,
      title: "C4 published for IT",
      body: "b",
      status: "published",
      publish_at: new Date().toISOString(),
      allow_response_revision: true,
      created_by: fx.users.admin.id,
    })
    .select("id")
    .single();
  await admin
    .from("circular_targets")
    .insert({ circular_id: c4.id, school_id: fx.schoolId, department_id: fx.d1Id });

  // The head is given a school-wide assignment first: that is the case the
  // tautological predicate used to let through, because `ura.department_id =
  // department_id` resolved to `ura.department_id = ura.department_id`.
  await admin.from("user_role_assignments").insert({
    user_id: fx.users.head.id,
    role_id: fx.roleIds.department_head,
    department_id: null,
  });
  await expectDenied("a response cannot be attributed to a foreign department (0049)", () =>
    headC
      .from("circular_responses")
      .insert({
        circular_id: c4.id,
        school_id: fx.schoolId,
        department_id: fx.d2Id,
        responder_id: fx.users.head.id,
        response_type: "acknowledgement",
        status: "acknowledged",
      })
      .select("id"),
  );

  // The same responder, targeting their own department, is still allowed.
  const { data: ownResponse, error: ownResponseErr } = await headC
    .from("circular_responses")
    .insert({
      circular_id: c4.id,
      school_id: fx.schoolId,
      department_id: fx.d1Id,
      responder_id: fx.users.head.id,
      response_type: "acknowledgement",
      status: "acknowledged",
    })
    .select("id")
    .single();
  check(
    "a response for the responder's own department is allowed (0049)",
    !ownResponseErr && Boolean(ownResponse?.id),
    ownResponseErr?.message ?? "inserted",
  );

  // 0050 / FI-08: Transactional RPC rotation preserves is_latest on failure.
  const { data: revResp, error: revErr } = await headC.rpc("submit_circular_response", {
    p_circular_id: c4.id,
    p_school_id: fx.schoolId,
    p_department_id: fx.d1Id,
    p_response_type: "acknowledgement",
    p_status: "acknowledged",
    p_reason: null,
  });
  check(
    "submit_circular_response RPC rotates previous response (0050)",
    !revErr && Boolean(revResp?.id) && revResp.is_latest === true,
    revErr?.message ?? "rotated",
  );

  const { data: prevRow } = await admin
    .from("circular_responses")
    .select("is_latest")
    .eq("id", ownResponse.id)
    .single();
  check(
    "previous response is marked not latest after successful RPC (0050)",
    prevRow?.is_latest === false,
    `expected false, got ${prevRow?.is_latest}`,
  );

  // A failed revision (e.g. rejection with missing reason) rolls back and preserves revResp as latest
  const { error: failedRevErr } = await headC.rpc("submit_circular_response", {
    p_circular_id: c4.id,
    p_school_id: fx.schoolId,
    p_department_id: fx.d1Id,
    p_response_type: "acknowledgement",
    p_status: "rejected",
    p_reason: null,
  });
  check(
    "submit_circular_response rejects invalid status (0050)",
    Boolean(failedRevErr),
    failedRevErr ? "failed as expected" : "unexpected success",
  );

  const { data: currentLatest } = await admin
    .from("circular_responses")
    .select("id, is_latest")
    .eq("id", revResp.id)
    .single();
  check(
    "failed RPC preserves previous is_latest row (FI-08)",
    currentLatest?.is_latest === true,
    `expected true, got ${currentLatest?.is_latest}`,
  );

  // Foreign department cannot be targeted by head
  const { error: foreignDeptRpcErr } = await headC.rpc("submit_circular_response", {
    p_circular_id: c4.id,
    p_school_id: fx.schoolId,
    p_department_id: fx.d2Id,
    p_response_type: "acknowledgement",
    p_status: "acknowledged",
    p_reason: null,
  });
  check(
    "submit_circular_response rejects foreign department (0050)",
    Boolean(foreignDeptRpcErr),
    foreignDeptRpcErr ? "failed as expected" : "unexpected success",
  );

  // D-3: achievements are a school-administrator action; members read.
  await expectDenied("a member cannot create an achievement (D-3)", () =>
    staffC
      .from("school_achievements")
      .insert({ school_id: fx.schoolId, title_ar: "x", created_by: fx.users.staff1.id })
      .select("id"),
  );

  const { data: adminAchievement, error: adminAchievementErr } = await adminC
    .from("school_achievements")
    .insert({ school_id: fx.schoolId, title_ar: "x", created_by: fx.users.admin.id })
    .select("id")
    .single();
  check(
    "a school administrator can create an achievement (D-3)",
    !adminAchievementErr && Boolean(adminAchievement?.id),
    adminAchievementErr?.message ?? "inserted",
  );
  if (adminAchievement?.id) {
    await admin.from("school_achievements").delete().eq("id", adminAchievement.id);
  }

  // N11: the trigger is the single writer of `assigned_operator_id`, and it
  // must clear the column when the assignment is revoked.
  const { data: operatorBefore } = await admin
    .from("maintenance_requests")
    .select("assigned_operator_id")
    .eq("id", fx.mr1)
    .single();
  await admin
    .from("maintenance_assignments")
    .update({ is_active: false })
    .eq("request_id", fx.mr1)
    .eq("school_id", fx.schoolId);
  const { data: operatorAfter } = await admin
    .from("maintenance_requests")
    .select("assigned_operator_id")
    .eq("id", fx.mr1)
    .single();
  check(
    "revoking an assignment clears the request operator (N11)",
    operatorBefore?.assigned_operator_id === fx.users.operator.id &&
      operatorAfter?.assigned_operator_id === null,
    `${operatorBefore?.assigned_operator_id} -> ${operatorAfter?.assigned_operator_id}`,
  );

  await adminC.storage.from("public-assets").remove([calendarPath]);
} finally {
  if (fx) await cleanup(admin, fx);
  const ok = summary();
  if (!ok) process.exit(1);
}
