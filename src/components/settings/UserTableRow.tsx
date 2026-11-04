"use client";

import { useTranslations } from "next-intl";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";
import { resolveRoleDisplayName } from "@/lib/rbac/resolveRoleDisplayName";
import { UserTableActions } from "./UserTableActions";
import { UserStatusBadge } from "./UserStatusBadge";

export function UserTableRow({
  user,
  isSelf,
  canManage,
  isPending,
  onEdit,
  onToggle,
}: {
  user: SchoolUserRow;
  isSelf: boolean;
  canManage: boolean;
  isPending: boolean;
  onEdit: () => void;
  onToggle: (id: string, status: boolean) => void;
}) {
  const tRbac = useTranslations("rbac");

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{user.full_name}</span>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {user.email && <span>{user.email}</span>}
            {user.phone && <span>• {user.phone}</span>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{user.job_title ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{user.department_name ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="outline">{resolveRoleDisplayName(user.role_key, tRbac)}</Badge>
      </TableCell>
      <TableCell>
        <UserStatusBadge isActive={user.is_active} />
      </TableCell>
      {canManage && (
        <TableCell className="text-end">
          <UserTableActions
            userId={user.id}
            isActive={user.is_active}
            isSelf={isSelf}
            isOwner={user.is_owner}
            isPending={isPending}
            onEdit={onEdit}
            onToggle={() => onToggle(user.id, user.is_active)}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
