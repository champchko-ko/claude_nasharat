import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import type { SchoolDocumentSlug } from "./types";

export interface InsertDocumentParams {
  schoolId: string;
  slug: SchoolDocumentSlug;
  title: string;
  description: string | null;
  filePath: string;
  file: File;
  profileId?: string | null;
}

export async function insertSchoolDocumentRecord(
  supabase: SupabaseClient,
  params: InsertDocumentParams,
): Promise<string> {
  const payload: Record<string, unknown> = {
    school_id: params.schoolId,
    slug: params.slug,
    title: params.title,
    description: params.description,
    file_path: params.filePath,
    file_name: params.file.name,
    file_size: params.file.size,
    mime_type: params.file.type,
    created_by: params.profileId ?? null,
    is_published: true,
  };

  let { data: inserted, error: insertError } = await supabase
    .from("school_documents")
    .insert(payload)
    .select("id")
    .single();

  if (
    insertError &&
    (insertError.code === "42703" || insertError.message?.includes("is_published"))
  ) {
    delete payload.is_published;
    const retry = await supabase.from("school_documents").insert(payload).select("id").single();
    inserted = retry.data;
    insertError = retry.error;
  }

  if (insertError || !inserted) {
    throw mapDatabaseError(insertError, "Failed to register document");
  }

  return inserted.id;
}
