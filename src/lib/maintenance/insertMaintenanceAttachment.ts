import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertMaintenanceAttachment(
  supabase: SupabaseClient,
  params: {
    requestId: string;
    schoolId: string;
    kind: "report" | "evidence";
    path: string;
    mime: string | null;
    sizeBytes: number | null;
    uploadedBy: string;
  },
): Promise<{ error?: string }> {
  const { error } = await supabase.from("maintenance_attachments").insert({
    request_id: params.requestId,
    school_id: params.schoolId,
    kind: params.kind,
    path: params.path,
    mime: params.mime,
    size_bytes: params.sizeBytes,
    uploaded_by: params.uploadedBy,
  });

  if (error) return { error: error.message };
  return {};
}
