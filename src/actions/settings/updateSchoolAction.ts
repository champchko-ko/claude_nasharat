"use server";

import { revalidatePath } from "next/cache";
import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCanUpdateSchoolSettings } from "./assertCanUpdateSchoolSettings";
import { parseSchoolFormData } from "@/lib/validation/parseSchoolFormData";
import { cleanFormField } from "@/lib/validation/cleanFormField";
import { uploadSchoolLogo } from "@/lib/school/uploadSchoolLogo";
import { persistSchoolProfile } from "@/lib/school/persistSchoolProfile";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function updateSchoolAction(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("User is not authenticated");
    }

    const formSchoolId = cleanFormField(formData.get("school_id"));
    const targetSchoolId = await assertCanUpdateSchoolSettings(profile, formSchoolId);

    const parsed = parseSchoolFormData(formData);
    if (!parsed.nameAr || !parsed.nameEn) {
      throw new ValidationError("Both Arabic and English school names are required");
    }

    const supabase = await createSupabaseServerClient();
    const logoFile = formData.get("logo") as File | null;
    const uploadRes = await uploadSchoolLogo(supabase, targetSchoolId, logoFile);
    if (uploadRes.error) {
      throw mapDatabaseError(uploadRes.error, "Failed to upload school logo");
    }

    const admin = createSupabaseAdminClient({
      actorId: profile.id,
      actorLabel: profile.email || "system",
    });
    const persistResult = await persistSchoolProfile(admin, targetSchoolId, parsed, uploadRes.path);
    if (!persistResult.success) {
      throw mapDatabaseError(persistResult.error, "Failed to save school profile");
    }

    revalidateSettingsPath("school");
    revalidatePath("/[locale]/(app)", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/en/dashboard");
    revalidatePath("/[locale]/(app)/dashboard", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
