"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCanDeleteAttachment } from "./assertCanDeleteAttachment";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { DatabaseError } from "@/lib/errors/DatabaseError";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteCircularAttachmentAction(
  attachmentId: string,
  circularId: string,
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("Unauthorized");
    }

    await assertCanDeleteAttachment("singleton", profile.id);

    const supabase = await createSupabaseServerClient();
    const { data: attachment, error: readError } = await supabase
      .from("circular_attachments")
      .select("path")
      .eq("id", attachmentId)
      .maybeSingle();

    if (readError) {
      throw mapDatabaseError(readError);
    }

    if (attachment) {
      const { error: removeError } = await supabase.storage
        .from("circular-attachments")
        .remove([attachment.path]);
      if (removeError) {
        throw new DatabaseError("Could not delete the stored file. Please try again.");
      }
    }

    const { data: deleted, error } = await supabase
      .from("circular_attachments")
      .delete()
      .eq("id", attachmentId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw mapDatabaseError(error);
    }
    if (!deleted) {
      throw new NotFoundError("Attachment not found");
    }

    revalidatePath(`/[locale]/circulars/${circularId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
