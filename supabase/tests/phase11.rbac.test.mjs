// Phase 11 Complete Positive & Negative RBAC Verification Battery
// Run: node scripts/runPhase11Rbac.mjs
import { check, expectDenied, getEnv, makeAdmin, signInAs, summary } from "./rls.helpers.test.mjs";

const env = getEnv();
const admin = makeAdmin(env);
const ts = Date.now();
const PASSWORD = "Rls-Battery-2026!";

console.log(`\n======================================================`);
console.log(`  STARTING PHASE 11 POSITIVE & NEGATIVE RBAC AUDIT    `);
console.log(`======================================================\n`);

async function purgeP11Fixtures() {
  await admin.from("profiles").delete().like("email", "%@p11.local");
  await admin.from("schools").delete().like("slug", "p11-%");
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  for (const u of data?.users || []) {
    if (u.email?.includes("p11")) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
}

try {
  await purgeP11Fixtures();

  // 1. Setup School 1 & School 2
  const { data: school1 } = await admin
    .from("schools")
    .insert({ name_ar: "مدرسة الاختبار الأولى", name_en: "School One", slug: `p11-s1-${ts}` })
    .select()
    .single();
  await admin.from("school_settings").insert({ school_id: school1.id, academic_year: "2025/2026" });

  const { data: d1 } = await admin
    .from("departments")
    .insert({ school_id: school1.id, name_ar: "قسم تكنولوجيا المعلومات", name_en: "IT" })
    .select()
    .single();

  const { data: d2 } = await admin
    .from("departments")
    .insert({ school_id: school1.id, name_ar: "قسم العلوم", name_en: "Science" })
    .select()
    .single();

  const { data: school2 } = await admin
    .from("schools")
    .insert({ name_ar: "مدرسة الاختبار الثانية", name_en: "School Two", slug: `p11-s2-${ts}` })
    .select()
    .single();
  await admin.from("school_settings").insert({ school_id: school2.id, academic_year: "2025/2026" });

  await admin
    .from("departments")
    .insert({ school_id: school2.id, name_ar: "قسم عام", name_en: "General" });

  // Roles lookup
  const { data: systemRoles } = await admin.from("roles").select("id, key").eq("is_system", true);
  const roleIds = Object.fromEntries(systemRoles.map((r) => [r.key, r.id]));

  // Create Custom Role: student_affairs for School 1
  const { data: saRole } = await admin
    .from("roles")
    .insert({
      school_id: school1.id,
      key: `student_affairs_${ts}`,
      name: "شؤون الطلاب",
      is_system: false,
    })
    .select()
    .single();

  // Grant circular.respond and maintenance.create to student_affairs custom role
  await admin.from("role_permissions").insert([
    { role_id: saRole.id, permission_key: "circular.respond" },
    { role_id: saRole.id, permission_key: "maintenance.create" },
  ]);

  // 2. Provision all test fixture users
  const userDefs = [
    ["owner1", "p11-owner1", "owner", null, null],
    ["owner2", "p11-owner2", "owner", null, null], // 2nd owner to test multi-owner vs last-owner
    ["admin1", "p11-admin1", "school_admin", school1.id, null],
    ["admin1b", "p11-admin1b", "school_admin", school1.id, null], // 2nd admin in School 1
    ["admin2", "p11-admin2", "school_admin", school2.id, null], // School 2 admin
    ["head", "p11-head", "department_head", school1.id, d1.id],
    ["staff1", "p11-staff1", "staff", school1.id, d1.id],
    ["staff2", "p11-staff2", "staff", school1.id, d2.id],
    ["op1", "p11-op1", "operator", school1.id, null],
    ["op2", "p11-op2", "operator", school1.id, null], // 2nd operator
    ["auditor", "p11-auditor", "auditor", school1.id, null],
    ["student_affairs", "p11-sa", null, school1.id, d2.id], // uses custom role in dept D2
    ["disabled", "p11-disabled", "staff", school1.id, d1.id],
  ];

  const users = {};
  const creds = {};

  for (const [name, prefix, roleKey, schId, deptId] of userDefs) {
    const email = `${prefix}-${ts}@p11.local`;
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
      full_name: `User ${name}`,
      email,
      school_id: schId,
      department_id: deptId,
      is_active: name !== "disabled",
    });

    const targetRoleId = roleKey ? roleIds[roleKey] : saRole.id;
    await admin.from("user_role_assignments").insert({
      user_id: authData.user.id,
      role_id: targetRoleId,
      school_id: schId,
      department_id: deptId,
    });
  }

  // Find owner assignment IDs
  const { data: owner1Assignment } = await admin
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", users.owner1.id)
    .single();
  const owner1AssignmentId = owner1Assignment.id;

  const { data: owner2Assignment } = await admin
    .from("user_role_assignments")
    .select("id")
    .eq("user_id", users.owner2.id)
    .single();
  const owner2AssignmentId = owner2Assignment.id;

  // 3. Authenticate clients
  const owner1C = await signInAs(env, creds.owner1.email, PASSWORD);
  const admin1C = await signInAs(env, creds.admin1.email, PASSWORD);
  const admin2C = await signInAs(env, creds.admin2.email, PASSWORD);
  const headC = await signInAs(env, creds.head.email, PASSWORD);
  const staff1C = await signInAs(env, creds.staff1.email, PASSWORD);
  const op1C = await signInAs(env, creds.op1.email, PASSWORD);
  const op2C = await signInAs(env, creds.op2.email, PASSWORD);
  const audC = await signInAs(env, creds.auditor.email, PASSWORD);
  const saC = await signInAs(env, creds.student_affairs.email, PASSWORD);

  console.log("Fixtures created and all test users signed in successfully.\n");

  // =========================================================================
  // SECTION 1: POSITIVE AUTHORIZATION VERIFICATION (ALLOWED OPERATIONS)
  // =========================================================================
  console.log("--- SECTION 1: POSITIVE AUTHORIZATION (ALLOWED OPERATIONS) ---");

  // 1.1 Owner: Platform Settings Update
  const ownerPlatformUpdate = await owner1C
    .from("system_settings")
    .upsert({ key: "maintenance_mode", value: { enabled: false } })
    .select();
  check(
    "POSIX 1.1: Platform Owner successfully updates platform system settings",
    !ownerPlatformUpdate.error && (ownerPlatformUpdate.data?.length ?? 0) > 0,
    ownerPlatformUpdate.error?.message,
  );

  // 1.2 Owner: View Global Audit Logs
  const ownerAuditRead = await owner1C.from("audit_logs").select("id").limit(3);
  check(
    "POSIX 1.2: Platform Owner successfully reads global audit logs",
    !ownerAuditRead.error,
    ownerAuditRead.error?.message,
  );

  // 1.3 School Admin: School Settings Update
  const adminSchoolUpdate = await admin1C
    .from("school_settings")
    .update({ academic_year: "2026/2027" })
    .eq("school_id", school1.id)
    .select();
  check(
    "POSIX 1.3: School Admin successfully updates school settings",
    !adminSchoolUpdate.error && (adminSchoolUpdate.data?.length ?? 0) === 1,
    adminSchoolUpdate.error?.message,
  );

  // 1.4 School Admin: Create Custom Role in School
  const adminCreateRole = await admin1C
    .from("roles")
    .insert({
      school_id: school1.id,
      key: `custom_lead_${ts}`,
      name: "Lead Teacher",
      is_system: false,
    })
    .select()
    .single();
  check(
    "POSIX 1.4: School Admin successfully creates custom school role",
    !adminCreateRole.error && Boolean(adminCreateRole.data?.id),
    adminCreateRole.error?.message,
  );

  // 1.5 School Admin: Grant Permissions to School Role
  const adminGrantPerm = await admin1C
    .from("role_permissions")
    .insert({ role_id: adminCreateRole.data.id, permission_key: "maintenance.create" })
    .select();
  check(
    "POSIX 1.5: School Admin successfully configures permissions on school role",
    !adminGrantPerm.error && (adminGrantPerm.data?.length ?? 0) === 1,
    adminGrantPerm.error?.message,
  );

  // 1.6 School Admin: Assign Role to School Member
  const adminAssignRole = await admin1C
    .from("user_role_assignments")
    .insert({
      user_id: users.staff2.id,
      role_id: adminCreateRole.data.id,
      school_id: school1.id,
      department_id: d2.id,
      assigned_by: users.admin1.id,
    })
    .select();
  check(
    "POSIX 1.6: School Admin successfully assigns custom role to school member",
    !adminAssignRole.error && (adminAssignRole.data?.length ?? 0) === 1,
    adminAssignRole.error?.message,
  );

  // 1.7 School Admin: Circular Lifecycle (Create -> Target -> Publish)
  const adminCreateCirc = await admin1C
    .from("circulars")
    .insert({
      school_id: school1.id,
      ref_number: `CIR-TEST-${ts}`,
      title: "Mandatory IT Circular",
      body: "Instructions for IT Dept",
      status: "draft",
      created_by: users.admin1.id,
    })
    .select()
    .single();
  check(
    "POSIX 1.7: School Admin successfully creates draft circular",
    !adminCreateCirc.error && Boolean(adminCreateCirc.data?.id),
    adminCreateCirc.error?.message,
  );
  const circularId = adminCreateCirc.data.id;

  // 1.8 School Admin: Target Circular to Department D1 and D2
  const adminTargetCirc = await admin1C
    .from("circular_targets")
    .insert([
      {
        circular_id: circularId,
        school_id: school1.id,
        department_id: d1.id,
      },
      {
        circular_id: circularId,
        school_id: school1.id,
        department_id: d2.id,
      },
    ])
    .select();
  check(
    "POSIX 1.8: School Admin successfully targets circular to departments",
    !adminTargetCirc.error && (adminTargetCirc.data?.length ?? 0) === 2,
    adminTargetCirc.error?.message,
  );

  // 1.9 School Admin: Publish Circular
  const adminPublishCirc = await admin1C
    .from("circulars")
    .update({ status: "published", publish_at: new Date().toISOString() })
    .eq("id", circularId)
    .select();
  check(
    "POSIX 1.9: School Admin successfully publishes circular",
    !adminPublishCirc.error && adminPublishCirc.data?.[0]?.status === "published",
    adminPublishCirc.error?.message,
  );

  // 1.10 Department Head (Dept D1): Respond to Targeted Circular
  const headRespondCirc = await headC
    .from("circular_responses")
    .insert({
      circular_id: circularId,
      school_id: school1.id,
      department_id: d1.id,
      responder_id: users.head.id,
      response_type: "acknowledgement",
      status: "acknowledged",
      is_latest: true,
    })
    .select();
  check(
    "POSIX 1.10: Department Head successfully submits response to targeted circular",
    !headRespondCirc.error && (headRespondCirc.data?.length ?? 0) === 1,
    headRespondCirc.error?.message,
  );

  // 1.11 Student Affairs (Dept D2): Respond to Assigned Circular
  const saRespondCirc = await saC
    .from("circular_responses")
    .insert({
      circular_id: circularId,
      school_id: school1.id,
      department_id: d2.id,
      responder_id: users.student_affairs.id,
      response_type: "acknowledgement",
      status: "acknowledged",
      is_latest: true,
    })
    .select();
  check(
    "POSIX 1.11: Student Affairs (custom role) successfully responds to assigned circular",
    !saRespondCirc.error && (saRespondCirc.data?.length ?? 0) === 1,
    saRespondCirc.error?.message,
  );

  // 1.12 School Admin: View Circular Responses
  const adminViewResponses = await admin1C
    .from("circular_responses")
    .select("id, status, department_id")
    .eq("circular_id", circularId);
  check(
    "POSIX 1.12: School Admin successfully views circular responses across departments",
    !adminViewResponses.error && (adminViewResponses.data?.length ?? 0) >= 2,
    adminViewResponses.error?.message,
  );

  // 1.13 Staff: Submit Maintenance Request
  const staffCreateTicket = await staff1C
    .from("maintenance_requests")
    .insert({
      school_id: school1.id,
      ticket_number: `TKT-STAFF-${ts}`,
      title: "Broken Air Conditioner",
      description: "AC leaking in room 12",
      priority: "medium",
      status: "submitted",
      reporter_id: users.staff1.id,
      reporter_department_id: d1.id,
    })
    .select()
    .single();
  check(
    "POSIX 1.13: Staff member successfully creates maintenance ticket",
    !staffCreateTicket.error && Boolean(staffCreateTicket.data?.id),
    staffCreateTicket.error?.message,
  );
  const ticketId = staffCreateTicket.data.id;

  // 1.14 School Admin: Assign Maintenance Ticket to Operator 1 (legal transition: submitted -> assigned)
  const adminAssignTicket = await admin1C
    .from("maintenance_requests")
    .update({ assigned_operator_id: users.op1.id, status: "assigned" })
    .eq("id", ticketId)
    .select();
  check(
    "POSIX 1.14: School Admin successfully assigns maintenance ticket to technician",
    !adminAssignTicket.error &&
      adminAssignTicket.data?.[0]?.assigned_operator_id === users.op1.id &&
      adminAssignTicket.data?.[0]?.status === "assigned",
    adminAssignTicket.error?.message,
  );

  // 1.15 Operator 1: Advance Assigned Ticket Status to In-Progress (legal transition: assigned -> in_progress)
  const opStartTicket = await op1C
    .from("maintenance_requests")
    .update({ status: "in_progress" })
    .eq("id", ticketId)
    .select();
  check(
    "POSIX 1.15: Assigned Operator successfully moves ticket to in_progress",
    !opStartTicket.error && opStartTicket.data?.[0]?.status === "in_progress",
    opStartTicket.error?.message,
  );

  // 1.16 Operator 1: Add Work Note to Assigned Ticket
  const opAddNote = await op1C
    .from("maintenance_updates")
    .insert({
      request_id: ticketId,
      school_id: school1.id,
      author_id: users.op1.id,
      kind: "note",
      new_value: "Compressor inspected, part replaced.",
    })
    .select();
  check(
    "POSIX 1.16: Assigned Operator successfully adds work note to ticket",
    !opAddNote.error && (opAddNote.data?.length ?? 0) === 1,
    opAddNote.error?.message,
  );

  // 1.17 Operator 1: Advance Assigned Ticket to Resolved (legal transition: in_progress -> resolved)
  const opResolveTicket = await op1C
    .from("maintenance_requests")
    .update({ status: "resolved" })
    .eq("id", ticketId)
    .select();
  check(
    "POSIX 1.17: Assigned Operator successfully resolves maintenance ticket",
    !opResolveTicket.error && opResolveTicket.data?.[0]?.status === "resolved",
    opResolveTicket.error?.message,
  );

  // 1.18 School Admin: Verify and Close Ticket (legal transition: resolved -> closed)
  const adminCloseTicket = await admin1C
    .from("maintenance_requests")
    .update({ status: "closed" })
    .eq("id", ticketId)
    .select();
  check(
    "POSIX 1.18: School Admin successfully verifies and closes maintenance ticket",
    !adminCloseTicket.error && adminCloseTicket.data?.[0]?.status === "closed",
    adminCloseTicket.error?.message,
  );

  // 1.19 School Admin: Calendar Event Creation
  const now = new Date().toISOString();
  const later = new Date(Date.now() + 86400000).toISOString();
  const adminCreateCal = await admin1C
    .from("calendar_events")
    .insert({
      school_id: school1.id,
      title_ar: "حفل الافتتاح",
      title_en: "Parent-Teacher Conference",
      starts_at: now,
      ends_at: later,
      visibility: "public",
      status: "published",
      created_by: users.admin1.id,
    })
    .select();
  check(
    "POSIX 1.19: School Admin successfully manages calendar events",
    !adminCreateCal.error && (adminCreateCal.data?.length ?? 0) === 1,
    adminCreateCal.error?.message,
  );

  // 1.20 Auditor: View School Audit Logs (Read-Only)
  const audReadLogs = await audC
    .from("audit_logs")
    .select("id, action, created_at")
    .eq("school_id", school1.id)
    .limit(5);
  check(
    "POSIX 1.20: Auditor successfully reads school audit logs",
    !audReadLogs.error && (audReadLogs.data?.length ?? 0) > 0,
    audReadLogs.error?.message,
  );

  // 1.21 Auditor: View School Maintenance Reports (Read-Only)
  const audReadTickets = await audC
    .from("maintenance_requests")
    .select("id, ticket_number, status")
    .eq("school_id", school1.id);
  check(
    "POSIX 1.21: Auditor successfully views maintenance report records",
    !audReadTickets.error && (audReadTickets.data?.length ?? 0) > 0,
    audReadTickets.error?.message,
  );

  // =========================================================================
  // SECTION 2: NEGATIVE AUTHORIZATION VERIFICATION (UNAUTHORIZED BLOCKED)
  // =========================================================================
  console.log("\n--- SECTION 2: NEGATIVE AUTHORIZATION (BLOCKED SCENARIOS) ---");

  // 2.1 Staff blocked from modifying platform settings
  await expectDenied("NEG 2.1: Staff cannot update system_settings", () =>
    staff1C
      .from("system_settings")
      .update({ value: { hacked: true } })
      .eq("key", "maintenance_mode")
      .select(),
  );

  // 2.2 Staff blocked from modifying school settings
  await expectDenied("NEG 2.2: Staff cannot update school_settings", () =>
    staff1C
      .from("school_settings")
      .update({ academic_year: "9999" })
      .eq("school_id", school1.id)
      .select(),
  );

  // 2.3 Staff blocked from creating or publishing circulars
  await expectDenied("NEG 2.3: Staff cannot insert circulars", () =>
    staff1C
      .from("circulars")
      .insert({
        school_id: school1.id,
        ref_number: `CIR-FAKE-${ts}`,
        title: "Fake",
        body: "Fake",
      })
      .select(),
  );

  // 2.4 Staff blocked from responding to circulars
  await expectDenied("NEG 2.4: Staff cannot respond to circulars", () =>
    staff1C
      .from("circular_responses")
      .insert({
        circular_id: circularId,
        school_id: school1.id,
        department_id: d1.id,
        responder_id: users.staff1.id,
        response_type: "acknowledgement",
        status: "acknowledged",
      })
      .select(),
  );

  // 2.5 Staff blocked from managing roles
  await expectDenied("NEG 2.5: Staff cannot insert roles", () =>
    staff1C.from("roles").insert({ school_id: school1.id, key: "hacker", name: "Hacker" }).select(),
  );

  // 2.6 Operator 2 (unassigned) blocked from modifying ticket assigned to Operator 1
  await expectDenied("NEG 2.6: Unassigned Operator cannot modify another operator's ticket", () =>
    op2C.from("maintenance_requests").update({ status: "in_progress" }).eq("id", ticketId).select(),
  );

  // 2.7 Operator 1 blocked from skipping ticket directly to closed from assigned
  const { data: ticket2 } = await admin
    .from("maintenance_requests")
    .insert({
      school_id: school1.id,
      ticket_number: `TKT-OP-TEST-${ts}`,
      title: "Test Skip",
      description: "d",
      reporter_id: users.staff1.id,
      reporter_department_id: d1.id,
      status: "submitted",
    })
    .select()
    .single();

  await admin
    .from("maintenance_requests")
    .update({ status: "assigned", assigned_operator_id: users.op1.id })
    .eq("id", ticket2.id);

  await expectDenied("NEG 2.7: Operator cannot skip assigned ticket directly to closed", () =>
    op1C.from("maintenance_requests").update({ status: "closed" }).eq("id", ticket2.id).select(),
  );

  // 2.8 Department Head blocked from responding to another department's circular
  await expectDenied("NEG 2.8: Department Head cannot respond for a foreign department", () =>
    headC
      .from("circular_responses")
      .insert({
        circular_id: circularId,
        school_id: school1.id,
        department_id: d2.id, // Science dept (Head belongs to IT)
        responder_id: users.head.id,
        response_type: "acknowledgement",
        status: "acknowledged",
      })
      .select(),
  );

  // 2.9 Auditor blocked from modifying audit logs
  await expectDenied("NEG 2.9: Auditor cannot insert audit logs directly", () =>
    audC
      .from("audit_logs")
      .insert({
        school_id: school1.id,
        action: "fake.action",
        actor_label: "auditor",
      })
      .select(),
  );

  // 2.10 Auditor blocked from creating maintenance requests
  await expectDenied("NEG 2.10: Auditor cannot create maintenance requests", () =>
    audC
      .from("maintenance_requests")
      .insert({
        school_id: school1.id,
        ticket_number: `TKT-AUD-${ts}`,
        title: "Auditor Ticket",
        description: "Test",
      })
      .select(),
  );

  // =========================================================================
  // SECTION 3: COMPREHENSIVE OWNER & ADMIN ACCOUNT PROTECTION
  // =========================================================================
  console.log("\n--- SECTION 3: OWNER & ADMIN ACCOUNT PROTECTION ---");

  // 3.1 School Admin cannot update Owner's profile email
  await expectDenied("PROT 3.1: School Admin cannot modify Owner's email", () =>
    admin1C
      .from("profiles")
      .update({ email: "hacked-owner@test.com" })
      .eq("id", users.owner1.id)
      .select(),
  );

  // 3.2 School Admin cannot deactivate Owner's profile
  await expectDenied("PROT 3.2: School Admin cannot deactivate Owner's profile", () =>
    admin1C.from("profiles").update({ is_active: false }).eq("id", users.owner1.id).select(),
  );

  // 3.3 School Admin cannot delete Owner's role assignment
  await expectDenied("PROT 3.3: School Admin cannot delete Owner's role assignment", () =>
    admin1C.from("user_role_assignments").delete().eq("id", owner1AssignmentId).select(),
  );

  // 3.4 Staff cannot modify School Admin's profile
  await expectDenied("PROT 3.4: Staff cannot modify School Admin's profile", () =>
    staff1C.from("profiles").update({ is_active: false }).eq("id", users.admin1.id).select(),
  );

  // 3.5 Staff cannot delete School Admin's role assignment
  await expectDenied("PROT 3.5: Staff cannot delete School Admin's role assignment", () =>
    staff1C.from("user_role_assignments").delete().eq("user_id", users.admin1.id).select(),
  );

  // 3.6 Cross-School Admin (School 2) cannot modify School 1's Admin
  await expectDenied("PROT 3.6: Cross-School Admin cannot modify School 1 Admin profile", () =>
    admin2C.from("profiles").update({ is_active: false }).eq("id", users.admin1.id).select(),
  );

  // 3.7 Non-owner cannot call bootstrap_platform_owner
  await expectDenied("PROT 3.7: Non-owner cannot call bootstrap_platform_owner", () =>
    admin1C.rpc("bootstrap_platform_owner"),
  );

  // 3.8 Multi-owner governance: Owner 1 can demote Owner 2 when multiple owners exist
  const ownerDemoteSecond = await owner1C
    .from("user_role_assignments")
    .delete()
    .eq("id", owner2AssignmentId)
    .select();
  check(
    "PROT 3.8: Owner can demote a secondary owner when multiple platform owners exist",
    !ownerDemoteSecond.error && (ownerDemoteSecond.data?.length ?? 0) === 1,
    ownerDemoteSecond.error?.message,
  );

  // 3.9 Multi-admin governance: School Admin 1 can demote School Admin 1B when 2 admins exist
  const adminDemoteSecond = await admin1C
    .from("user_role_assignments")
    .delete()
    .eq("user_id", users.admin1b.id)
    .select();
  check(
    "PROT 3.9: School Admin can demote secondary administrator when multiple admins exist",
    !adminDemoteSecond.error && (adminDemoteSecond.data?.length ?? 0) === 1,
    adminDemoteSecond.error?.message,
  );

  // 3.10 Last-admin lockout guard: Now that only 1 school admin remains, cannot demote the sole admin
  await expectDenied(
    "PROT 3.10: School Admin CANNOT demote the sole remaining school administrator",
    () => admin1C.from("user_role_assignments").delete().eq("user_id", users.admin1.id).select(),
  );

  // 3.11 Last-admin lockout guard: Sole school admin cannot deactivate their own profile
  await expectDenied("PROT 3.11: Sole School Admin CANNOT deactivate their own profile", () =>
    admin1C.from("profiles").update({ is_active: false }).eq("id", users.admin1.id).select(),
  );

  // =========================================================================
  // SECTION 4: MULTI-TENANT ISOLATION
  // =========================================================================
  console.log("\n--- SECTION 4: MULTI-TENANT ISOLATION ---");

  // 4.1 School 2 Admin sees 0 School 1 circulars
  const s2CircCount = await admin2C
    .from("circulars")
    .select("id", { count: "exact" })
    .eq("school_id", school1.id);
  check("TENANT 4.1: School 2 Admin cannot see School 1 circulars", s2CircCount.data?.length === 0);

  // 4.2 School 2 Admin sees 0 School 1 maintenance requests
  const s2TicketCount = await admin2C
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("school_id", school1.id);
  check(
    "TENANT 4.2: School 2 Admin cannot see School 1 maintenance tickets",
    s2TicketCount.data?.length === 0,
  );

  // 4.3 School 2 Admin cannot update School 1 settings
  await expectDenied("TENANT 4.3: School 2 Admin cannot update School 1 settings", () =>
    admin2C
      .from("school_settings")
      .update({ academic_year: "3000" })
      .eq("school_id", school1.id)
      .select(),
  );

  // 4.4 School 2 Admin cannot insert role for School 1
  await expectDenied("TENANT 4.4: School 2 Admin cannot insert role in School 1", () =>
    admin2C
      .from("roles")
      .insert({ school_id: school1.id, key: "cross_school", name: "Cross" })
      .select(),
  );

  console.log(`\n======================================================`);
  console.log(`  PHASE 11 POSITIVE & NEGATIVE RBAC AUDIT COMPLETE     `);
  console.log(`======================================================\n`);

  const passed = summary();
  if (!passed) process.exit(1);
} catch (err) {
  console.error("FATAL ERROR in Phase 11 test execution:", err);
  process.exit(1);
}
