import type { CircularDetail } from "./getCircularById";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export function canRespondToCircular(
  circular: CircularDetail,
  profile: ProfileRow | null,
): boolean {
  if (circular.status !== "published" || !profile?.department_id) {
    return false;
  }
  if (circular.targets.length === 0) {
    return true;
  }
  return circular.targets.some((tgt) => tgt.department_id === profile.department_id);
}
