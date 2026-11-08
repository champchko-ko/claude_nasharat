import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertCircularAttachment(
  supabase: SupabaseClient,
  params: {
    circularId: string;
    schoolId: string;
    path: string;
    mime: string | null;
    sizeBytes: number | null;
    uploadedBy: string;
  },
): Promise<{ error?: string }> {
  void params.schoolId;
  const { error } = await supabase.from("circular_attachments").insert({
    circular_id: params.circularId,
    path: params.path,
    mime: params.mime,
    size_bytes: params.sizeBytes,
    uploaded_by: params.uploadedBy,
  });

  if (error) return { error: error.message };
  return {};
}
