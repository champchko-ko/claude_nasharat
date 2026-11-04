"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { EditUserForm } from "./EditUserForm";

export function EditUserDialog({
  user,
  departments,
  roles = [],
  isOpen,
  onClose,
}: {
  user: SchoolUserRow;
  departments: DepartmentRow[];
  roles?: SchoolRoleRow[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("settings");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editUser")}</DialogTitle>
        </DialogHeader>
        <EditUserForm user={user} departments={departments} roles={roles} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
