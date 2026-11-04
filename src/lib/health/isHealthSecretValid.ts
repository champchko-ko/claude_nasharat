import { constantTimeCompare } from "@/lib/security/constantTimeCompare";

export function isHealthSecretValid(request: Request, expectedSecret?: string): boolean {
  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return false;
  }

  const presented = authHeader.slice("Bearer ".length).trim();
  return constantTimeCompare(presented, expectedSecret);
}
