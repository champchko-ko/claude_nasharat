import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Inserts the department targets of a circular.
 *
 * The caller must surface the returned error; silently ignoring it could leave
 * a published circular with no audience (audit finding H-15). A unique
 * violation (23505) means the desired rows already exist, which is success for
 * an idempotent retry.
 */
export async function insertCircularTargets(
  supabase: SupabaseClient,
  circularId: string,
  schoolId: string,
  departmentIds: string[],
): Promise<{ error?: string }> {
  void schoolId;
  const uniqueIds = [...new Set(departmentIds)];
  if (uniqueIds.length === 0) return {};

  const targets = uniqueIds.map((deptId) => ({
    circular_id: circularId,
    department_id: deptId,
  }));

  const { error } = await supabase.from("circular_targets").insert(targets);

  if (!error) return {};
  if (error.code === "23505") return {};
  return { error: error.message };
}
