import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { ValidationError } from "@/lib/errors/ValidationError";

/**
 * Rejects a client-supplied department id that does not exist. A null or empty
 * department is valid and is a no-op.
 */
export async function assertDepartmentExists(
  departmentId: string | null | undefined,
): Promise<void> {
  if (!departmentId) return;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }
  if (!data) {
    throw new ValidationError("The selected department does not exist");
  }
}
