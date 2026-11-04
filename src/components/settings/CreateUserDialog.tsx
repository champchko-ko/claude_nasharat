"use client";

import { useTranslations } from "next-intl";
import { UserPlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { CreateUserForm } from "./CreateUserForm";

export function CreateUserDialog({
  isOpen,
  departments,
  roles,
  onClose,
}: {
  isOpen: boolean;
  departments: DepartmentRow[];
  roles: SchoolRoleRow[];
  onClose: () => void;
}) {
  const t = useTranslations("settings");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="size-5 text-primary" />
            <span>{t("createUser")}</span>
          </DialogTitle>
        </DialogHeader>
        <CreateUserForm departments={departments} roles={roles} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
