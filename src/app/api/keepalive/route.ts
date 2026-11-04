import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron/assertCronAuthorized";
import { withApiErrorHandler } from "@/lib/errors";
import { pingSupabaseDatabase } from "@/lib/supabase";

async function handleKeepalivePing(request: Request) {
  const auth = assertCronAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await pingSupabaseDatabase();

  return NextResponse.json({
    status: "ok",
    message: "Supabase keepalive ping successful",
    ...result,
  });
}

// Only GET: that is what Vercel cron issues, and an unused POST export is just
// a second unauthenticated surface to keep patched.
export const GET = withApiErrorHandler(handleKeepalivePing);
