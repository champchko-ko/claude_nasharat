import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadMaintenancePhoto } from "./uploadMaintenancePhoto";

export async function handleOptionalPhoto(
  supabase: SupabaseClient,
  photo: File | null,
  params: {
    schoolId: string;
    requestId: string;
    uploadedBy: string;
    kind: "report" | "evidence";
  },
): Promise<{ error?: string }> {
  if (photo && photo.size > 0) {
    return uploadMaintenancePhoto(supabase, {
      photo,
      schoolId: params.schoolId,
      requestId: params.requestId,
      uploadedBy: params.uploadedBy,
      kind: params.kind,
    });
  }
  return {};
}
