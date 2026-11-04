"use client";

import { useTranslations } from "next-intl";
import { EyeIcon, PrinterIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printDocumentFile } from "@/lib/documents/printDocumentFile";

export function SchoolDocumentRowActions({
  fileUrl,
  onPreview,
  onEdit,
  onDelete,
}: {
  fileUrl?: string;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("documents");

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:self-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreview}
        className="gap-1 text-xs"
        title={t("preview")}
      >
        <EyeIcon className="size-3.5" />
        <span className="hidden md:inline">{t("preview")}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => printDocumentFile(fileUrl)}
        className="gap-1 text-xs"
        title={t("print")}
      >
        <PrinterIcon className="size-3.5" />
        <span className="hidden md:inline">{t("print")}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="gap-1 text-xs"
        title={t("editDocument")}
      >
        <PencilIcon className="size-3.5" />
        <span className="hidden md:inline">{t("editDocument")}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        className="text-destructive hover:bg-destructive/10"
        title={t("deleteDocument")}
        aria-label={t("deleteDocument")}
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
