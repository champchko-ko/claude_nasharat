import { isHealthSecretValid } from "./isHealthSecretValid";
import { isCallerPlatformOwner } from "./isCallerPlatformOwner";

export interface HealthCheckAuthResult {
  authorized: boolean;
  status: 200 | 401 | 403 | 503;
  error?: string;
}

export async function assertHealthCheckAuthorized(
  request: Request,
): Promise<HealthCheckAuthResult> {
  const expectedSecret = process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET;

  if (isHealthSecretValid(request, expectedSecret)) {
    return { authorized: true, status: 200 };
  }

  if (await isCallerPlatformOwner()) {
    return { authorized: true, status: 200 };
  }

  if (process.env.NODE_ENV === "production" && !expectedSecret) {
    return {
      authorized: false,
      status: 503,
      error: "HEALTH_CHECK_SECRET or CRON_SECRET is not configured for deep checks",
    };
  }

  if (process.env.NODE_ENV !== "production" && !expectedSecret) {
    return { authorized: true, status: 200 };
  }

  return {
    authorized: false,
    status: 401,
    error: "Unauthorized: deep health checks require authorization",
  };
}
