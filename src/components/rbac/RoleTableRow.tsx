"use client";

import { useTranslations } from "next-intl";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { resolveRoleDisplayName } from "@/lib/rbac/resolveRoleDisplayName";
import { RoleBadge } from "./RoleBadge";
import { RoleTableActions } from "./RoleTableActions";

export function RoleTableRow({
  role,
  canManage,
  onEdit,
}: {
  role: SchoolRoleRow;
  canManage: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("rbac");

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {role.is_system ? resolveRoleDisplayName(role.key, t, role.name) : role.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{role.key}</span>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge isSystem={role.is_system} />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {t("permissionsCount", { count: role.permissions.length })}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {t("usersCount", { count: role.user_count })}
        </span>
      </TableCell>
      <TableCell className="text-end">
        <RoleTableActions role={role} canManage={canManage} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}
