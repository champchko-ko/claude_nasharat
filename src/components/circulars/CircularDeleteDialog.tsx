"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2Icon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteCircularAction } from "@/actions/circulars/deleteCircularAction";

export function CircularDeleteDialog({
  circularId,
  open,
  onOpenChange,
  onDeleted,
}: {
  circularId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const t = useTranslations("circulars");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCircularAction(circularId);
      if (res.success) {
        toast.success(t("deleteSuccess"));
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(res.error || t("deleteFailed"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3 text-destructive">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Trash2Icon className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
              <DialogDescription>{t("confirmDeleteDesc")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
            className="gap-2"
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            <span>{tCommon("delete")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
