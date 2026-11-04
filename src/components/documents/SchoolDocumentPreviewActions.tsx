"use client";

import { useTranslations } from "next-intl";
import { PrinterIcon, DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printDocumentFile } from "@/lib/documents/printDocumentFile";
import type { SchoolDocumentRow } from "@/lib/documents/types";

export function SchoolDocumentPreviewActions({
  currentDoc,
  onClose,
}: {
  currentDoc?: SchoolDocumentRow | null;
  onClose: () => void;
}) {
  const t = useTranslations("documents");
  const fileUrl = currentDoc?.file_url;

  return (
    <div className="flex items-center gap-2">
      {fileUrl ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printDocumentFile(fileUrl)}
            className="gap-1.5 text-xs"
            aria-label={t("print")}
          >
            <PrinterIcon className="size-3.5 text-primary" />
            <span>{t("print")}</span>
          </Button>

          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={currentDoc?.file_name}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-card hover:text-foreground"
            aria-label={t("download")}
          >
            <DownloadIcon className="size-3.5 text-primary" />
            <span>{t("download")}</span>
          </a>
        </>
      ) : null}

      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("close")}>
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
