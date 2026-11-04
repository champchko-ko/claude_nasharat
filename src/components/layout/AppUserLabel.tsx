"use client";

import { useLocale } from "next-intl";
import { Building2Icon } from "lucide-react";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import { resolveDepartmentName } from "@/lib/auth/resolveDepartmentName";

export function AppUserLabel({ profile }: { profile: ProfileRow | null }) {
  const locale = useLocale();
  const displayName = profile?.full_name ?? "User";
  const deptName = resolveDepartmentName(profile, locale);

  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm leading-none font-medium">{displayName}</p>
      {Boolean(profile?.email) && (
        <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
      )}
      {Boolean(profile?.job_title) && (
        <p className="text-xs text-muted-foreground">{profile?.job_title}</p>
      )}
      {Boolean(deptName) && (
        <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-primary">
          <Building2Icon className="size-3 shrink-0" />
          <span className="truncate">{deptName}</span>
        </div>
      )}
    </div>
  );
}
