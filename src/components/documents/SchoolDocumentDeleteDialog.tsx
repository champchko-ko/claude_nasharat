"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteSchoolDocumentAction } from "@/actions/documents/deleteSchoolDocumentAction";
import { resolveDocumentErrorMessage } from "@/lib/documents/resolveDocumentErrorMessage";

export function SchoolDocumentDeleteDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("documents");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const result = await deleteSchoolDocumentAction(documentId);
    setIsDeleting(false);

    if (result.success) {
      toast.success(t("documentDeleted"));
      onSuccess();
      onClose();
    } else {
      const friendlyError = resolveDocumentErrorMessage(result.error, t);
      setErrorMessage(friendlyError);
      toast.error(friendlyError);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-6" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
            {t("deleteConfirmTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2 text-center">
          <p className="text-sm font-semibold text-foreground">&laquo;{documentTitle}&raquo;</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteConfirmMessage")}
          </p>
          {errorMessage ? (
            <p className="mt-2 text-xs font-semibold text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-border/80 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-w-[90px]"
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                <span>{t("deleting")}</span>
              </>
            ) : (
              <span>{t("delete")}</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
