import { timingSafeEqualString } from "./timingSafeEqualString";

export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 503; error: string };

/**
 * Decides whether a cron-triggered request may run.
 *
 * Failing closed is the point: before this check the endpoint was public
 * whenever `CRON_SECRET` was unset, which is exactly the state a fresh
 * deployment is in. Setting the secret turns the endpoint into a
 * bearer-only route; leaving it unset in production rejects every call instead
 * of exposing the route. Development stays usable without a secret.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` automatically once the
 * variable exists in the project, so no secret is committed to `vercel.json`.
 */
export function assertCronAuthorized(request: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        error: "CRON_SECRET is not configured for this deployment",
      };
    }
    return { ok: true };
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!presented || !timingSafeEqualString(presented, expected)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
