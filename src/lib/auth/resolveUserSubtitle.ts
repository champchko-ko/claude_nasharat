import type { ProfileRow } from "./getCurrentProfile";

export function resolveUserSubtitle(profile: ProfileRow | null, deptName: string | null): string {
  if (deptName) {
    if (profile?.job_title) {
      return `${profile.job_title} · ${deptName}`;
    }
    return deptName;
  }
  return profile?.job_title ?? profile?.email ?? "";
}
