import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors/ValidationError";

export interface ExistingDocumentInfo {
  id: string;
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
    .select("id, slug, file_path")
    .eq("id", id)
    .single();

  if (error || !existing) {
    throw new ValidationError("Document not found");
  }

  void schoolId;
  return existing;
}
