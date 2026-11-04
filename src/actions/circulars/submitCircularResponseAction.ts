"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCanRespondToCircular } from "@/lib/circulars/assertCanRespondToCircular";
import { executeSubmitCircularResponse } from "@/lib/circulars/executeSubmitCircularResponse";
import { validateCircularResponse } from "@/lib/validation/validateCircularResponse";
import type { CircularResponseStatus, CircularResponseType } from "@/lib/circulars/types";
import { ValidationError } from "@/lib/errors/ValidationError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function submitCircularResponseAction({
  circularId,
  responseType,
  status,
  reason,
}: {
  circularId: string;
  responseType: CircularResponseType;
  status: CircularResponseStatus;
  reason?: string | null;
}): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    const { schoolId, departmentId } = await assertCanRespondToCircular(profile);

    if (!validateCircularResponse(status, reason)) {
      throw new ValidationError("Rejection reason is required");
    }

    const supabase = await createSupabaseServerClient();
    await executeSubmitCircularResponse({
      supabase,
      circularId,
      schoolId,
      departmentId,
      responderId: profile!.id,
      responseType,
      status,
      reason,
    });

    revalidatePath("/[locale]/circulars", "page");
    revalidatePath(`/[locale]/circulars/${circularId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
