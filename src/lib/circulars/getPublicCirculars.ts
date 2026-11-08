import { createSupabaseServerClient } from "@/lib/supabase";
import type { CircularRow } from "./types";

/** Fetches published circulars that are marked as public for the public school portal. */
export async function getPublicCirculars(schoolId?: string | null): Promise<CircularRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("circulars")
    .select(
      `
      id, ref_number, title, body, category, priority, status, visibility,
      response_type, response_instructions, allow_response_revision,
      publish_at, due_at, created_by, closed_at, created_at,
      attachments:circular_attachments(
        id, circular_id, path, mime, size_bytes, uploaded_by, created_at
      )
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data as unknown as CircularRow[]) ?? []).filter(
    (circular) => circular.visibility === "public",
  );
}
