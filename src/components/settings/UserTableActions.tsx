"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { PencilIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/actions/settings/deleteUserAction";
import { showConfirmBox } from "@/lib/feedback/showConfirmBox";

export function UserTableActions({
  userId,
  isActive,
  isSelf,
  isOwner = false,
  isPending,
  onEdit,
  onToggle,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
  isOwner?: boolean;
  isPending: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  if (isOwner) {
    return (
      <span className="flex items-center justify-end gap-1 text-xs font-medium text-warning">
        <ShieldCheckIcon className="size-3.5" />
        <span>{t("ownerProtected")}</span>
      </span>
    );
  }

  const handleDelete = async () => {
    const confirmed = await showConfirmBox({
      message: tCommon("confirmDelete"),
      type: "warning",
    });
    if (!confirmed) return;
    startDeleteTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.success) {
        toast.success(tCommon("deleted"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  const disabled = isPending || isDeleting;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onEdit}
        title={tCommon("edit")}
      >
        <PencilIcon className="size-3.5" />
      </Button>
      <Button variant="outline" size="sm" disabled={disabled || isSelf} onClick={onToggle}>
        {isActive ? tCommon("deactivate") : tCommon("activate")}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled || isSelf}
        onClick={handleDelete}
        title={tCommon("delete")}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
