"use server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { assertCanManageCirculars } from "@/lib/circulars/assertCanManageCirculars";
import { getCircularReminderRecipients } from "@/lib/circulars/getCircularReminderRecipients";
import { getCircularReminderMeta } from "@/lib/circulars/getCircularReminderMeta";
import { buildCircularReminderBody } from "@/lib/circulars/buildCircularReminderBody";
import { revalidateCircularReminderPaths } from "@/lib/circulars/revalidateCircularReminderPaths";
import { dispatchModuleNotification } from "@/lib/notifications/dispatchModuleNotification";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export interface RemindCircularPayload {
  circularId?: string | null;
  targetType: "pending" | "all" | "custom";
  customUserIds?: string[];
  customMessage?: string;
}

export async function remindCircularAction(
  payload: RemindCircularPayload,
): Promise<ActionResult<{ count?: number }>> {
  try {
    const auth = await assertCanManageCirculars();
    if (!auth.authorized) {
      return { success: false, error: auth.error, code: "UNAUTHORIZED" };
    }

    const supabase = await createSupabaseServerClient();
    const meta = await getCircularReminderMeta(supabase, payload.circularId);

    const recipientUserIds = await getCircularReminderRecipients({
      supabase,
      schoolId: auth.schoolId,
      circularId: payload.circularId,
      targetType: payload.targetType,
      customUserIds: payload.customUserIds,
    });

    const filteredRecipients = recipientUserIds.filter((id) => id !== auth.profileId);
    if (!filteredRecipients.length) {
      return { success: true, count: 0 };
    }

    const body = buildCircularReminderBody(meta.ref, meta.title, payload.customMessage);

    const { delivered } = await dispatchModuleNotification({
      recipientUserIds: filteredRecipients,
      schoolId: auth.schoolId,
      type: "circular",
      title: "circular_reminder",
      body,
      entityType: "circular",
      entityId: payload.circularId ?? null,
      skipThrottle: true,
    });

    revalidateCircularReminderPaths(payload.circularId);

    return { success: true, count: delivered };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
