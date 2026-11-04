import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import type { SchoolDocumentRow } from "./types";

const DOC_SELECT_FIELDS =
  "id, school_id, slug, title, description, file_path, file_name, file_size, mime_type, is_published, created_by, created_at, updated_at";

const FALLBACK_SELECT_FIELDS =
  "id, school_id, slug, title, description, file_path, file_name, file_size, mime_type, created_by, created_at, updated_at";

export async function getPublicSchoolDocuments(
  schoolId?: string | null,
): Promise<SchoolDocumentRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("school_documents")
    .select(DOC_SELECT_FIELDS)
    .eq("school_id", schoolId)
    .or("is_published.eq.true,is_published.is.null")
    .order("created_at", { ascending: false });

  let rows: Record<string, unknown>[] | null = data;
  if (error) {
    const fallback = await supabase
      .from("school_documents")
      .select(FALLBACK_SELECT_FIELDS)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    rows = fallback.data;
  }

  if (!rows || rows.length === 0) {
    const admin = createSupabaseAdminClient();
    const adminRes = await admin
      .from("school_documents")
      .select(FALLBACK_SELECT_FIELDS)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    rows = adminRes.data ?? rows;
  }

  if (!rows) return [];

  return rows.map((doc) => ({
    ...doc,
    is_published: typeof doc.is_published === "boolean" ? doc.is_published : true,
    file_url: `/api/documents/${doc.id as string}/preview`,
  })) as unknown as SchoolDocumentRow[];
}
