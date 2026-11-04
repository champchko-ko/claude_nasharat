import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { logError } from "@/lib/logger";
import type { CircularAttachmentRow } from "./types";

export async function getCircularAttachments(circularId: string): Promise<CircularAttachmentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("circular_attachments")
    .select("id, circular_id, school_id, path, mime, size_bytes, uploaded_by, created_at")
    .eq("circular_id", circularId)
    .order("created_at", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }
  if (!data || data.length === 0) {
    return [];
  }

  const adminClient = createSupabaseAdminClient();
  const paths = data.map((item) => item.path);
  const { data: signedList, error: signError } = await adminClient.storage
    .from("circular-attachments")
    .createSignedUrls(paths, 3600);

  if (signError) {
    logError(signError, { circularId, pathsCount: paths.length });
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
    ...(item as CircularAttachmentRow),
    public_url: urlMap.get(item.path),
  }));
}
