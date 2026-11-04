"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { RoleTableRow } from "./RoleTableRow";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { EditRoleDialog } from "./EditRoleDialog";

export function RoleList({ roles, canManage }: { roles: SchoolRoleRow[]; canManage: boolean }) {
  const t = useTranslations("rbac");
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<SchoolRoleRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ShieldCheckIcon className="size-5 text-primary" />
            <span>{t("rolesAndPermissions")}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{t("rolesSubtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreating(true)} size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            <span>{t("createRole")}</span>
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("roleName")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("permissions")}</TableHead>
              <TableHead>{t("users")}</TableHead>
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <RoleTableRow
                key={role.id}
                role={role}
                canManage={canManage}
                onEdit={() => setEditingRole(role)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {isCreating && <CreateRoleDialog isOpen={isCreating} onClose={() => setIsCreating(false)} />}

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          isOpen={Boolean(editingRole)}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}
