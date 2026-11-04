import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors/ValidationError";

export interface ExistingDocumentInfo {
  id: string;
  school_id: string;
  slug: string;
  file_path: string;
}

export async function findDocumentForSchool(
  client: SupabaseClient,
  id: string,
  schoolId: string,
): Promise<ExistingDocumentInfo> {
  const { data: existing, error } = await client
    .from("school_documents")
    .select("id, school_id, slug, file_path")
    .eq("id", id)
    .eq("school_id", schoolId)
    .single();

  if (error || !existing) {
    throw new ValidationError("Document not found");
  }

  return existing;
}
