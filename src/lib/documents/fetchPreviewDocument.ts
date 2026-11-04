import type { SupabaseClient } from "@supabase/supabase-js";

export interface PreviewDocumentRecord {
  file_path: string;
  mime_type: string;
  school_id: string;
  is_published: boolean;
}

export async function fetchPreviewDocument(
  admin: SupabaseClient,
  id: string,
): Promise<PreviewDocumentRecord | null> {
  const { data: document, error: documentError } = await admin
    .from("school_documents")
    .select("file_path, mime_type, school_id, is_published")
    .eq("id", id)
    .maybeSingle();

  if (document) {
    return document as PreviewDocumentRecord;
  }

  if (documentError && documentError.code === "42703") {
    const fallback = await admin
      .from("school_documents")
      .select("file_path, mime_type, school_id")
      .eq("id", id)
      .maybeSingle();

    if (fallback.data) {
      return { ...fallback.data, is_published: true } as PreviewDocumentRecord;
    }
  }

  return null;
}
