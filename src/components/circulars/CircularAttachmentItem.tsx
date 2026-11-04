"use client";

import { useState } from "react";
import { FileTextIcon } from "lucide-react";
import { formatAttachmentFileName } from "@/lib/circulars/formatAttachmentFileName";
import { getAttachmentKind } from "@/lib/circulars/getAttachmentKind";
import { CircularAttachmentActions } from "./CircularAttachmentActions";
import { CircularAttachmentEmbeddedView } from "./CircularAttachmentEmbeddedView";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import type { CircularAttachmentRow } from "@/lib/circulars/types";

export function CircularAttachmentItem({
  attachment,
  canManage,
  isPending,
  onDelete,
}: {
  attachment: CircularAttachmentRow;
  canManage: boolean;
  isPending: boolean;
  onDelete: (id: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const fileName = formatAttachmentFileName(attachment.path);
  const kind = getAttachmentKind(attachment.path, attachment.mime);
  const sizeKb = attachment.size_bytes ? (attachment.size_bytes / 1024).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[linear-gradient(135deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))] text-[color:var(--action-foreground,#fff)]">
            <FileTextIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground" title={fileName}>
              {fileName}
            </p>
            {sizeKb ? (
              <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                {sizeKb} KB
              </span>
            ) : null}
          </div>
        </div>

        <CircularAttachmentActions
          publicUrl={attachment.public_url}
          fileName={fileName}
          attachmentId={attachment.id}
          canManage={canManage}
          isPending={isPending}
          onExpand={() => setModalOpen(true)}
          onDelete={onDelete}
        />
      </div>

      <CircularAttachmentEmbeddedView
        publicUrl={attachment.public_url}
        fileName={fileName}
        kind={kind}
        onExpand={() => setModalOpen(true)}
      />

      <AttachmentPreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        publicUrl={attachment.public_url}
        fileName={fileName}
        kind={kind}
      />
    </div>
  );
}
