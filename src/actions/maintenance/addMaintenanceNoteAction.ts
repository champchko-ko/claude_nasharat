"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { parseMaintenanceNoteData } from "@/lib/validation/parseMaintenanceNoteData";
import { insertMaintenanceUpdate } from "@/lib/maintenance/insertMaintenanceUpdate";
import { assertCanAddNote } from "@/lib/maintenance/assertCanAddNote";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function addMaintenanceNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("No school associated with profile");
    }

    const { requestId, note } = parseMaintenanceNoteData(formData);
    if (!requestId || !note.trim()) {
      throw new ValidationError("Note cannot be empty");
    }

    const supabase = await createSupabaseServerClient();
    const { data: ticket, error: ticketError } = await supabase
      .from("maintenance_requests")
      .select("id, reporter_id, assigned_operator_id")
      .eq("id", requestId)
      .maybeSingle();

    if (ticketError) {
      throw mapDatabaseError(ticketError);
    }

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    const canAdd = await assertCanAddNote(
      "singleton",
      profile.id,
      ticket.reporter_id,
      ticket.assigned_operator_id,
    );
    if (!canAdd) {
      throw new ForbiddenError("Unauthorized to add notes");
    }

    const res = await insertMaintenanceUpdate(supabase, {
      requestId,
      schoolId: "singleton",
      authorId: profile.id,
      kind: "note",
      reason: note.trim(),
    });

    if (res.error) {
      throw mapDatabaseError(res.error, "Failed to add note");
    }

    revalidatePath(`/[locale]/maintenance/${requestId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
