"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { XIcon, DownloadIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { printAttachment } from "@/lib/circulars/printAttachment";
import { downloadAttachmentFile } from "@/lib/circulars/downloadAttachmentFile";
import type { AttachmentKind } from "@/lib/circulars/getAttachmentKind";

export function AttachmentPreviewModal({
  open,
  onClose,
  publicUrl,
  fileName,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  publicUrl?: string;
  fileName: string;
  kind: AttachmentKind;
}) {
  const t = useTranslations("circulars");
  useDrawerEscape(onClose, open && Boolean(publicUrl));
  if (!open || !publicUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex animate-in flex-col bg-scrim/85 p-4 backdrop-blur-sm fade-in-0 sm:p-6"
    >
      <div className="flex items-center justify-between pb-4 text-scrim-foreground">
        <h3 className="max-w-md truncate text-sm font-semibold">{fileName}</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => downloadAttachmentFile(publicUrl, fileName)}
            className="text-scrim-foreground hover:bg-scrim-foreground/10"
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">{t("downloadAttachment")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => printAttachment(publicUrl)}
            className="text-scrim-foreground hover:bg-scrim-foreground/10"
          >
            <PrinterIcon className="size-4" />
            <span className="hidden sm:inline">{t("printAttachment")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-scrim-foreground hover:bg-scrim-foreground/10"
            aria-label={t("closePreview")}
          >
            <XIcon className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl bg-background/5 p-2">
        {kind === "image" ? (
          <Image
            src={publicUrl}
            alt={fileName}
            width={1200}
            height={800}
            unoptimized
            className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <iframe
            src={publicUrl}
            title={fileName}
            className="h-[80vh] w-full max-w-5xl rounded-lg border border-border bg-background shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
