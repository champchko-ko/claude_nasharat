import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { logError } from "@/lib/logger";
import type { MaintenanceAttachmentRow } from "./types";

export async function getMaintenanceAttachments(
  requestId: string,
): Promise<MaintenanceAttachmentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_attachments")
    .select("id, request_id, school_id, kind, path, mime, size_bytes, uploaded_by, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }
  if (!data || data.length === 0) {
    return [];
  }

  const paths = data.map((item) => item.path);
  const { data: signedList, error: signError } = await supabase.storage
    .from("maintenance-photos")
    .createSignedUrls(paths, 3600);

  if (signError) {
    logError(signError, { requestId, pathsCount: paths.length });
  }

  const urlMap = new Map<string, string>();
  if (signedList) {
    for (const item of signedList) {
      if (item.signedUrl && item.path) {
        urlMap.set(item.path, item.signedUrl);
      }
    }
  }

  return data.map((item) => ({
    ...item,
    public_url: urlMap.get(item.path),
  }));
}
