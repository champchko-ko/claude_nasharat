"use server";

import { revalidatePath } from "next/cache";
import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ConflictError } from "@/lib/errors/ConflictError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteDepartmentAction(departmentId: string): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile?.school_id) {
      throw new AuthenticationError("No school associated with profile");
    }

    const allowed = await hasPermission("settings.school.update", profile.school_id);
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const supabase = await createSupabaseServerClient();
    const { error, count } = await supabase
      .from("departments")
      .delete({ count: "exact" })
      .eq("id", departmentId)
      .eq("school_id", profile.school_id);

    if (error) {
      if (error.code === "23503") {
        throw new ConflictError(
          "Cannot delete department while users or circulars are assigned to it. Deactivate it instead.",
        );
      }
      throw mapDatabaseError(error);
    }

    if (count === 0) {
      throw new ConflictError("Department could not be deleted or does not exist.");
    }

    revalidateSettingsPath("departments");
    revalidatePath("/circulars/new");
    revalidatePath("/en/circulars/new");
    revalidatePath("/[locale]/(app)/circulars/new", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
