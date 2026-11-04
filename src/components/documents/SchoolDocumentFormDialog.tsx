"use client";

import { useTranslations } from "next-intl";
import { Loader2Icon, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDocumentFormSubmit } from "./useDocumentFormSubmit";
import { SchoolDocumentFileInput } from "./SchoolDocumentFileInput";
import { SchoolDocumentTextInputs } from "./SchoolDocumentTextInputs";
import type { SchoolDocumentRow, SchoolDocumentSlug } from "@/lib/documents/types";

export function SchoolDocumentFormDialog({
  isOpen,
  onClose,
  slug,
  existingDoc,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  slug: SchoolDocumentSlug;
  existingDoc?: SchoolDocumentRow | null;
  onSuccess: () => void;
}) {
  const t = useTranslations("documents");
  const isEditing = Boolean(existingDoc);
  const {
    title,
    setTitle,
    description,
    setDescription,
    setFile,
    isSubmitting,
    errorMessage,
    handleSubmit,
  } = useDocumentFormSubmit({ slug, existingDoc, onSuccess, onClose });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-lg p-6">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/80 pb-3">
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? t("editDocument") : t("addDocument")}
          </DialogTitle>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("close")}>
            <XIcon className="size-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <SchoolDocumentTextInputs
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
          />

          <SchoolDocumentFileInput
            isEditing={isEditing}
            currentFileName={existingDoc?.file_name}
            onFileChange={setFile}
          />

          <div className="flex items-center justify-end gap-2.5 border-t border-border/80 pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[90px]">
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("save")}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
