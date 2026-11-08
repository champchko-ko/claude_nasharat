import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import type { SchoolDocumentRow, SchoolDocumentSlug } from "./types";

const SLUG_DOC_FIELDS =
  "id, slug, title, description, file_path, file_name, file_size, mime_type, status, visibility, created_by, created_at, updated_at, creator:profiles!created_by(id, full_name)";

const SLUG_FALLBACK_FIELDS =
  "id, slug, title, description, file_path, file_name, file_size, mime_type, status, visibility, created_by, created_at, updated_at";

export async function getSchoolDocumentsBySlug(
  schoolId?: string | null,
  slug?: SchoolDocumentSlug,
): Promise<SchoolDocumentRow[]> {
  if (!schoolId || !slug) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("school_documents")
    .select(SLUG_DOC_FIELDS)
    .eq("slug", slug)
    .order("created_at", { ascending: false });

  let rows: Record<string, unknown>[] | null = data;
  if (error) {
    const fallback = await supabase
      .from("school_documents")
      .select(SLUG_FALLBACK_FIELDS)
      .eq("slug", slug)
      .order("created_at", { ascending: false });
    rows = fallback.data;
  }

  if (!rows || rows.length === 0) {
    const admin = createSupabaseAdminClient();
    const adminRes = await admin
      .from("school_documents")
      .select(SLUG_FALLBACK_FIELDS)
      .eq("slug", slug)
      .order("created_at", { ascending: false });
    rows = adminRes.data ?? rows;
  }

  if (!rows) return [];

  return rows.map((doc) => ({
    ...doc,
    is_published: doc.status === "published",
    file_url: `/api/documents/${doc.id as string}/preview`,
    creator: Array.isArray(doc.creator) ? (doc.creator[0] ?? null) : (doc.creator ?? null),
  })) as unknown as SchoolDocumentRow[];
}
