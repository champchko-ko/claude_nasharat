import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteMaintenanceRequestRecord(
  supabase: SupabaseClient,
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: attachments, error: readError } = await supabase
    .from("maintenance_attachments")
    .select("path")
    .eq("request_id", requestId);

  if (readError) {
    return { success: false, error: readError.message };
  }

  if (attachments && attachments.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("maintenance-photos")
      .remove(attachments.map((a) => a.path));

    if (removeError) {
      return {
        success: false,
        error: `Could not delete stored maintenance photos: ${removeError.message}`,
      };
    }
  }

  const { data: deleted, error } = await supabase
    .from("maintenance_requests")
    .delete()
    .eq("id", requestId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!deleted) return { success: false, error: "Maintenance request not found or not permitted" };

  return { success: true };
}

