"use client";

import { useTranslations } from "next-intl";
import { DownloadIcon, Trash2Icon, Loader2Icon, PrinterIcon, Maximize2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printAttachment } from "@/lib/circulars/printAttachment";
import { downloadAttachmentFile } from "@/lib/circulars/downloadAttachmentFile";

export function CircularAttachmentActions({
  publicUrl,
  fileName,
  attachmentId,
  canManage,
  isPending,
  onExpand,
  onDelete,
}: {
  publicUrl?: string;
  fileName: string;
  attachmentId: string;
  canManage: boolean;
  isPending: boolean;
  onExpand: () => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("circulars");

  return (
    <div className="flex items-center gap-1">
      {publicUrl ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onExpand}
            title={t("expandAttachment")}
            aria-label={t("expandAttachment")}
          >
            <Maximize2Icon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => printAttachment(publicUrl)}
            title={t("printAttachment")}
            aria-label={t("printAttachment")}
          >
            <PrinterIcon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => downloadAttachmentFile(publicUrl, fileName)}
            title={t("downloadAttachment")}
            aria-label={t("downloadAttachment")}
          >
            <DownloadIcon className="size-4" />
          </Button>
        </>
      ) : null}

      {canManage ? (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-destructive hover:bg-destructive/10"
          disabled={isPending}
          onClick={() => onDelete(attachmentId)}
          title={t("deleteAttachment")}
          aria-label={t("deleteAttachment")}
        >
          {isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <Trash2Icon className="size-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  );
}
