import type { SupabaseClient } from "@supabase/supabase-js";
import { maintenancePhotoRules } from "./maintenancePhotoRules";
import { validateStorageUpload } from "@/lib/storage/validateStorageUpload";
import { insertMaintenanceAttachment } from "./insertMaintenanceAttachment";

export async function uploadMaintenancePhoto(
  supabase: SupabaseClient,
  params: {
    photo: File;
    schoolId: string;
    requestId: string;
    uploadedBy: string;
    kind: "report" | "evidence";
  },
): Promise<{ error?: string }> {
  const validation = await validateStorageUpload(params.photo, maintenancePhotoRules);
  if (!validation.ok) {
    return { error: validation.error };
  }

  const cleanName = params.photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const prefix = params.kind === "evidence" ? "evidence_" : "";
  const storagePath = `${params.schoolId}/${params.requestId}/${prefix}${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("maintenance-photos")
    .upload(storagePath, validation.bytes, {
      contentType: params.photo.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return insertMaintenanceAttachment(supabase, {
    requestId: params.requestId,
    schoolId: params.schoolId,
    kind: params.kind,
    path: storagePath,
    mime: params.photo.type,
    sizeBytes: params.photo.size,
    uploadedBy: params.uploadedBy,
  });
}
