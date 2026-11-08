import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import type { SchoolDocumentRow } from "./types";

const DOC_SELECT_FIELDS =
  "id, slug, title, description, file_path, file_name, file_size, mime_type, status, visibility, created_by, created_at, updated_at";

const FALLBACK_SELECT_FIELDS =
  "id, slug, title, description, file_path, file_name, file_size, mime_type, status, visibility, created_by, created_at, updated_at";

export async function getPublicSchoolDocuments(
  schoolId?: string | null,
): Promise<SchoolDocumentRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("school_documents")
    .select(DOC_SELECT_FIELDS)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  let rows: Record<string, unknown>[] | null = data;
  if (error) {
    const fallback = await supabase
      .from("school_documents")
      .select(FALLBACK_SELECT_FIELDS)
      .order("created_at", { ascending: false });
    rows = fallback.data;
  }

  if (!rows || rows.length === 0) {
    const admin = createSupabaseAdminClient();
    const adminRes = await admin
      .from("school_documents")
      .select(FALLBACK_SELECT_FIELDS)
      .order("created_at", { ascending: false });
    rows = adminRes.data ?? rows;
  }

  if (!rows) return [];

  return rows.map((doc) => ({
    ...doc,
    is_published: doc.status === "published" && doc.visibility === "public",
    file_url: `/api/documents/${doc.id as string}/preview`,
  })) as unknown as SchoolDocumentRow[];
}
