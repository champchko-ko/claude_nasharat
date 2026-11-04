"use client";

import { useState } from "react";
import { Link } from "@/i18n";
import { useTranslations } from "next-intl";
import { EyeIcon, EditIcon, Trash2Icon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircularDeleteDialog } from "./CircularDeleteDialog";

export function CircularRowActions({
  circularId,
  canManage,
}: {
  circularId: string;
  canManage: boolean;
}) {
  const t = useTranslations("circulars");
  const tCommon = useTranslations("common");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">{tCommon("actions")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <Link href={`/circulars/${circularId}`}>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <EyeIcon className="size-4 text-muted-foreground" />
                <span>{t("viewDetails")}</span>
              </DropdownMenuItem>
            </Link>
            {canManage ? (
              <Link href={`/circulars/${circularId}/edit`}>
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <EditIcon className="size-4 text-muted-foreground" />
                  <span>{t("editCircular")}</span>
                </DropdownMenuItem>
              </Link>
            ) : null}
            {canManage ? (
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2 text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="size-4 text-destructive" />
                <span>{tCommon("delete")}</span>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CircularDeleteDialog
        circularId={circularId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
