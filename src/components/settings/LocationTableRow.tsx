"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toggleLocationStatusAction } from "@/actions/settings/toggleLocationStatusAction";
import { deleteLocationAction } from "@/actions/settings/deleteLocationAction";
import { showConfirmBox } from "@/lib/feedback/showConfirmBox";
import type { LocationRow } from "@/lib/school/getSchoolLocations";
import { LocationTableRowActions } from "./LocationTableRowActions";

export function LocationTableRow({
  loc,
  canManage,
  onEdit,
}: {
  loc: LocationRow;
  canManage: boolean;
  onEdit: () => void;
}) {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleLocationStatusAction(loc.id, loc.is_active);
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
      const res = await deleteLocationAction(loc.id);
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
      <TableCell className="font-medium text-foreground">{loc.building}</TableCell>
      <TableCell className="text-muted-foreground">{loc.floor ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{loc.room ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="outline">{loc.kind}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={loc.is_active ? "default" : "secondary"}>
          {loc.is_active ? tCommon("active") : tCommon("inactive")}
        </Badge>
      </TableCell>
      {canManage && (
        <TableCell className="text-end">
          <LocationTableRowActions
            isActive={loc.is_active}
            isPending={isPending}
            onEdit={onEdit}
            onToggle={handleToggle}
            onDelete={handleDelete}
            tCommon={tCommon}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
