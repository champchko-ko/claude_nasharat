import { NextResponse } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/sanitizeNextPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sanitizeError } from "@/lib/errors/sanitizeError";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Same-origin relative paths only: `?next=//evil.example` must not become a
  // redirect off the deployment.
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      sanitizeError(error, { endpoint: "/api/auth/callback" });
    } catch (err: unknown) {
      sanitizeError(err, { endpoint: "/api/auth/callback" });
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
}
