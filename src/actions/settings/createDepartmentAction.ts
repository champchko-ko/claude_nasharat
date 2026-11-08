"use server";

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

export async function createDepartmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("No school associated with profile");
    }

    const allowed = await hasPermission("settings.school.update");
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const nameAr = (formData.get("name_ar") as string)?.trim();
    const nameEn = (formData.get("name_en") as string)?.trim();

    const parsed = departmentSchema.safeParse({ nameAr, nameEn });
    if (!parsed.success) {
      throw formatZodError(parsed.error);
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("departments").insert({
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
    });

    if (error) {
      throw mapDatabaseError(error);
    }

    revalidateSettingsPath("departments");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
