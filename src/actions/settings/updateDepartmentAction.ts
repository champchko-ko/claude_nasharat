"use server";

import { revalidatePath } from "next/cache";
import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { departmentSchema, formatZodError } from "@/lib/validation";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function updateDepartmentAction(
  departmentId: string,
  nameAr: string,
  nameEn: string,
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile?.school_id) {
      throw new AuthenticationError("No school associated with profile");
    }

    const allowed = await hasPermission("settings.school.update", profile.school_id);
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const trimmedAr = nameAr.trim();
    const trimmedEn = nameEn.trim();
    const parsed = departmentSchema.safeParse({ nameAr: trimmedAr, nameEn: trimmedEn });
    if (!parsed.success) {
      throw formatZodError(parsed.error);
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("departments")
      .update({ name_ar: parsed.data.nameAr, name_en: parsed.data.nameEn })
      .eq("id", departmentId)
      .eq("school_id", profile.school_id);

    if (error) {
      throw mapDatabaseError(error);
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
