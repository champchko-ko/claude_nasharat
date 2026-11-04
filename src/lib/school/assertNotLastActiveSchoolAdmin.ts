import type { SupabaseClient } from "@supabase/supabase-js";
import { ConflictError } from "@/lib/errors/ConflictError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { checkAdminFallback } from "./checkAdminFallback";

export async function assertNotLastActiveSchoolAdmin(
  adminClient: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await adminClient.rpc("is_last_active_school_admin", {
    p_user_id: userId,
  });

  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") {
      await checkAdminFallback(adminClient, userId);
      return;
    }
    throw mapDatabaseError(error);
  }

  if (data === true) {
    throw new ConflictError(
      "Cannot deactivate the last active school administrator. Assign another administrator first.",
    );
  }
}
