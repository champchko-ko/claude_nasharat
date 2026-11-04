import { headers } from "next/headers";

/**
 * Resolves the client IP address from request headers in server components or server actions.
 */
export async function resolveRequestIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    return first || headerList.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}
