import { NextResponse } from "next/server";
import { withApiErrorHandler } from "@/lib/errors";
import { getBuildVersion } from "@/lib/health/getBuildVersion";
import { assertHealthCheckAuthorized } from "@/lib/health/assertHealthCheckAuthorized";
import { pingSupabaseDatabase } from "@/lib/supabase";

/**
 * Liveness probe, with an authorized dependency check.
 *
 * `GET /api/health` answers without touching anything, so an uptime monitor can
 * tell "process is down" apart from "database is down".
 *
 * `GET /api/health?deep=1` additionally runs one database query. To protect the
 * database from unauthenticated synthetic load and connection pool exhaustion,
 * deep checks require authorization (via Bearer token matching HEALTH_CHECK_SECRET/CRON_SECRET,
 * or an authenticated platform owner session).
 */
async function handleHealth(request: Request) {
  const url = new URL(request.url);
  const version = getBuildVersion();

  if (url.searchParams.get("deep") !== "1") {
    return NextResponse.json({ status: "ok", version, database: "not-checked" });
  }

  const auth = await assertHealthCheckAuthorized(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ping = await pingSupabaseDatabase();

  return NextResponse.json(
    {
      status: ping.success ? "ok" : "degraded",
      version,
      database: ping.success ? "ok" : "unreachable",
      latencyMs: ping.latencyMs,
    },
    { status: ping.success ? 200 : 503 },
  );
}

export const GET = withApiErrorHandler(handleHealth);
