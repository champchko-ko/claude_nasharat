"use server";

import { buildAuthRedirectUrl } from "@/lib/auth/buildAuthRedirectUrl";
import { createSupabaseServerClient } from "@/lib/supabase";
import { cleanFormField } from "@/lib/validation/cleanFormField";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { resolveRequestIp } from "@/lib/security/resolveRequestIp";
import { checkAuthRateLimit } from "@/lib/security/checkAuthRateLimit";

export async function requestPasswordResetAction(
  _prev: { success: boolean; error?: string | null },
  formData: FormData,
): Promise<{ success: boolean; error?: string | null }> {
  try {
    const email = cleanFormField(formData.get("email"));
    if (!email || !email.includes("@")) {
      return { success: false, error: "invalid" };
    }

    const clientIp = await resolveRequestIp();
    const isAllowed = checkAuthRateLimit({
      action: "password_reset",
      ip: clientIp,
      identifier: email,
    });
    if (!isAllowed) {
      return { success: false, error: "rate_limited" };
    }

    // The reset link is built from APP_URL, never from request headers: a
    // spoofed Host header must not be able to redirect the email.
    const redirectTo = buildAuthRedirectUrl("/reset-password");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      sanitizeError(error, { action: "requestPasswordResetAction", email });
      return { success: false, error: "failed" };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    sanitizeError(err, { action: "requestPasswordResetAction" });
    return { success: false, error: "failed" };
  }
}
