"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleDepartmentStatusAction } from "@/actions/settings/toggleDepartmentStatusAction";
import { deleteDepartmentAction } from "@/actions/settings/deleteDepartmentAction";
import { showConfirmBox } from "@/lib/feedback/showConfirmBox";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function DepartmentTableRow({
  dept,
  canManage,
  onEdit,
}: {
  dept: DepartmentRow;
  canManage: boolean;
  onEdit: () => void;
}) {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleDepartmentStatusAction(dept.id, dept.is_active);
      if (res.success) {
        toast.success(tCommon("saved"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmBox({
      message: tCommon("confirmDelete"),
      type: "warning",
    });
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteDepartmentAction(dept.id);
      if (res.success) {
        toast.success(tCommon("deleted"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{dept.name_ar}</TableCell>
      <TableCell className="text-muted-foreground">{dept.name_en}</TableCell>
      <TableCell>
        <Badge variant={dept.is_active ? "default" : "secondary"}>
          {dept.is_active ? tCommon("active") : tCommon("inactive")}
        </Badge>
      </TableCell>
      {canManage && (
        <TableCell className="text-end">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onEdit}
              title={tCommon("edit")}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
              {dept.is_active ? tCommon("inactive") : tCommon("active")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
              title={tCommon("delete")}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
