"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteCircularAttachmentAction } from "@/actions/circulars/deleteCircularAttachmentAction";
import { GoldDots } from "@/components/ui/gold-dots";
import { CircularAttachmentItem } from "./CircularAttachmentItem";
import type { CircularAttachmentRow } from "@/lib/circulars/types";

export function CircularAttachmentsList({
  attachments,
  circularId,
  canManage,
}: {
  attachments: CircularAttachmentRow[];
  circularId: string;
  canManage: boolean;
}) {
  const t = useTranslations("circulars");
  const [isPending, startTransition] = useTransition();

  if (!attachments || attachments.length === 0) return null;

  const handleDelete = (attachmentId: string) => {
    startTransition(async () => {
      const res = await deleteCircularAttachmentAction(attachmentId, circularId);
      if (res.success) {
        toast.success(t("attachmentDeleted"));
      } else {
        toast.error(res.error || "Failed to delete attachment");
      }
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-extrabold text-primary">
        {t("attachments")} ({attachments.length})
        <GoldDots />
      </h3>
      <div className="flex flex-col gap-6">
        {attachments.map((att) => (
          <CircularAttachmentItem
            key={att.id}
            attachment={att}
            canManage={canManage}
            isPending={isPending}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
