"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRoleAction } from "@/actions/rbac/deleteRoleAction";
import { showConfirmBox } from "@/lib/feedback/showConfirmBox";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";

export function RoleTableActions({
  role,
  canManage,
  onEdit,
}: {
  role: SchoolRoleRow;
  canManage: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("rbac");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await showConfirmBox({
      title: tCommon("warning"),
      message: t("confirmDeleteRole"),
      type: "warning",
    });
    if (!confirmed) return;
    startDeleteTransition(async () => {
      const res = await deleteRoleAction(role.id);
      if (res.success) {
        toast.success(tCommon("deleted"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  const isOwnerRole = role.key === "owner";
  const hasUsers = role.user_count > 0;
  const isDeleteDisabled = isDeleting || hasUsers;
  const deleteTitle = hasUsers ? t("cannotDeleteRoleWithUsers") : tCommon("delete");

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canManage && (
        <Button variant="outline" size="sm" onClick={onEdit} title={tCommon("edit")}>
          <PencilIcon className="size-3.5" />
        </Button>
      )}
      {canManage && !isOwnerRole && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isDeleteDisabled}
          onClick={handleDelete}
          title={deleteTitle}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
