import type { SupabaseClient } from "@supabase/supabase-js";
import { createE2eAdminClient } from "./createE2eAdminClient";
import { resolveSystemRoleId } from "./resolveSystemRoleId";

export type E2eUser = {
  id: string;
  email: string;
  fullName: string;
  password: string;
};

export type E2eFixture = {
  schoolId: string;
  departmentId: string;
  owner: E2eUser;
  admin: E2eUser;
  staff: E2eUser;
  operator: E2eUser;
};

const PASSWORD = "e2e-Password-123";

async function seedUser(
  admin: SupabaseClient,
  input: {
    email: string;
    fullName: string;
    roleKey: string;
    schoolId: string | null;
    departmentId: string | null;
  },
): Promise<E2eUser> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !created.user) {
    throw new Error(`E2E seed: could not create ${input.email}: ${error?.message ?? "no user"}`);
  }

  const id = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id,
    full_name: input.fullName,
    email: input.email,
    school_id: input.schoolId,
    department_id: input.departmentId,
    is_active: true,
  });
  if (profileError) {
    throw new Error(
      `E2E seed: could not create the profile for ${input.email}: ${profileError.message}`,
    );
  }

  const roleId = await resolveSystemRoleId(admin, input.roleKey);

  const { error: assignmentError } = await admin.from("user_role_assignments").insert({
    user_id: id,
    role_id: roleId,
    department_id: input.departmentId,
  });
  if (assignmentError) {
    throw new Error(
      `E2E seed: could not assign ${input.roleKey} to ${input.email}: ${assignmentError.message}`,
    );
  }

  return { id, email: input.email, fullName: input.fullName, password: PASSWORD };
}

/**
 * Creates a throwaway school with one administrator, one staff member and one
 * maintenance operator, so the journeys can run against a real session.
 */
export async function seedE2eFixture(): Promise<E2eFixture> {
  const admin = createE2eAdminClient();
  const ts = Date.now();

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .insert({
      name_ar: "مدرسة الاختبار",
      name_en: "E2E School",
      slug: `e2e-workflow-${ts}`,
    })
    .select("id")
    .single();
  if (schoolError || !school) {
    throw new Error(`E2E seed: could not create the school: ${schoolError?.message ?? ""}`);
  }

  await admin.from("school_settings").insert({ school_id: school.id });

  const { data: department, error: departmentError } = await admin
    .from("departments")
    .insert({ school_id: school.id, name_ar: "تقنية المعلومات", name_en: "IT" })
    .select("id")
    .single();
  if (departmentError || !department) {
    throw new Error(`E2E seed: could not create the department: ${departmentError?.message ?? ""}`);
  }

  const [owner, adminUser, staff, operator] = await Promise.all([
    // The platform owner has no school: the backup console and the restore RPC
    // both resolve ownership from a platform-scoped `owner` assignment.
    seedUser(admin, {
      email: `e2e-owner-${ts}@e2e.local`,
      fullName: "E2E Owner",
      roleKey: "owner",
      schoolId: null,
      departmentId: null,
    }),
    seedUser(admin, {
      email: `e2e-admin-${ts}@e2e.local`,
      fullName: "E2E Administrator",
      roleKey: "school_admin",
      schoolId: school.id,
      departmentId: null,
    }),
    seedUser(admin, {
      email: `e2e-staff-${ts}@e2e.local`,
      fullName: "E2E Staff",
      roleKey: "staff",
      schoolId: school.id,
      departmentId: department.id,
    }),
    seedUser(admin, {
      email: `e2e-operator-${ts}@e2e.local`,
      fullName: "E2E Operator",
      roleKey: "operator",
      schoolId: school.id,
      departmentId: null,
    }),
  ]);

  return {
    schoolId: school.id,
    departmentId: department.id,
    owner,
    admin: adminUser,
    staff,
    operator,
  };
}
