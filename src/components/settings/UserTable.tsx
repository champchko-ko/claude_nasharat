"use client";

import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";
import { UserTableRow } from "./UserTableRow";

export function UserTable({
  users,
  currentUserId,
  canManage,
  pendingUserId,
  onEdit,
  onToggle,
}: {
  users: SchoolUserRow[];
  currentUserId?: string | null;
  canManage: boolean;
  pendingUserId?: string | null;
  onEdit: (user: SchoolUserRow) => void;
  onToggle: (id: string, currentStatus: boolean) => void;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fullName")}</TableHead>
            <TableHead>{t("jobTitle")}</TableHead>
            <TableHead>{t("departments")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead className="w-28">{tCommon("status")}</TableHead>
            {canManage && <TableHead className="w-44 text-end">{tCommon("actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              canManage={canManage}
              isPending={user.id === pendingUserId}
              onEdit={() => onEdit(user)}
              onToggle={onToggle}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
