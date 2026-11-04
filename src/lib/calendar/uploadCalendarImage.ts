import type { SupabaseClient } from "@supabase/supabase-js";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";
import { calendarImageRules } from "./calendarImageRules";

export async function uploadCalendarImage(
  supabase: SupabaseClient,
  file: File,
  schoolId: string,
  folder = "calendar",
): Promise<{ path?: string; error?: string }> {
  const validation = await validateStorageUpload(file, calendarImageRules);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${schoolId}/${folder}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("public-assets")
    .upload(path, validation.bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return { path };
}
