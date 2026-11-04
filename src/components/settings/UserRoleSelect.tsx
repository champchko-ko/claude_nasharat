"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { resolveRoleDisplayName } from "@/lib/rbac/resolveRoleDisplayName";

export function UserRoleSelect({
  roleKey,
  setRoleKey,
  roles = [],
  disabled,
}: {
  roleKey: string;
  setRoleKey: (v: string) => void;
  roles?: SchoolRoleRow[];
  disabled: boolean;
}) {
  const t = useTranslations("settings");
  const tRbac = useTranslations("rbac");

  return (
    <div className="space-y-2">
      <Label htmlFor="edit_user_role">{t("role")}</Label>
      <select
        id="edit_user_role"
        value={roleKey}
        onChange={(e) => setRoleKey(e.target.value)}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {roles.length > 0 ? (
          roles
            .filter((r) => r.key !== "owner")
            .map((r) => (
              <option key={r.id} value={r.key}>
                {resolveRoleDisplayName(r.key, tRbac, r.name)}
              </option>
            ))
        ) : (
          <>
            <option value="staff">{t("roleStaff")}</option>
            <option value="department_head">{t("roleDeptHead")}</option>
            <option value="operator">{t("roleOperator")}</option>
            <option value="school_admin">{t("roleSchoolAdmin")}</option>
            <option value="auditor">{t("roleAuditor")}</option>
          </>
        )}
      </select>
    </div>
  );
}
