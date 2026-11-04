"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { assertCanManageDocuments } from "@/lib/documents/assertCanManageDocuments";
import { findDocumentForSchool } from "@/lib/documents/findDocumentForSchool";
import { getActorDetails } from "@/lib/documents/getActorDetails";
import { ValidationError } from "@/lib/errors/ValidationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteSchoolDocumentAction(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await assertCanManageDocuments();
    if (!auth.allowed || !auth.schoolId) {
      throw new ForbiddenError("Unauthorized to manage school documents");
    }

    if (!id) {
      throw new ValidationError("Document ID is required");
    }

    const admin = createSupabaseAdminClient(getActorDetails(auth.profile));

    const existing = await findDocumentForSchool(admin, id, auth.schoolId);

    const { error: deleteError } = await admin
      .from("school_documents")
      .delete()
      .eq("id", id)
      .eq("school_id", auth.schoolId);

    if (deleteError) {
      throw mapDatabaseError(deleteError, "Failed to delete document");
    }

    if (existing.file_path) {
      await admin.storage.from("school-documents").remove([existing.file_path]);
    }

    revalidatePath(`/[locale]/documents/${existing.slug}`, "page");
    revalidatePath(`/ar/documents/${existing.slug}`, "page");
    revalidatePath(`/en/documents/${existing.slug}`, "page");
    revalidatePath("/[locale]", "page");
    revalidatePath("/ar", "page");
    revalidatePath("/en", "page");
    revalidatePath("/", "page");

    return { success: true };
  } catch (error) {
    const sanitized = sanitizeError(error);
    return formatActionErrorResult(sanitized);
  }
}
