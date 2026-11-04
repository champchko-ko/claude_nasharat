"use server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { loginSchema } from "@/lib/validation/loginSchema";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { resolveRequestIp } from "@/lib/security/resolveRequestIp";
import { checkAuthRateLimit } from "@/lib/security/checkAuthRateLimit";

export async function loginAction(
  _prev: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) return { ok: false, error: "invalid" };

    const clientIp = await resolveRequestIp();
    const isAllowed = checkAuthRateLimit({
      action: "login",
      ip: clientIp,
      identifier: parsed.data.email,
    });
    if (!isAllowed) {
      return { ok: false, error: "rate_limited" };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { ok: false, error: "invalid" };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) {
      throw mapDatabaseError(profileError);
    }
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { ok: false, error: "disabled" };
    }

    return { ok: true, error: null };
  } catch (err: unknown) {
    sanitizeError(err, { action: "loginAction" });
    return { ok: false, error: "invalid" };
  }
}
