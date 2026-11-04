"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ZoomInIcon } from "lucide-react";
import type { AttachmentKind } from "@/lib/circulars/getAttachmentKind";

export function CircularAttachmentEmbeddedView({
  publicUrl,
  fileName,
  kind,
  onExpand,
}: {
  publicUrl?: string;
  fileName: string;
  kind: AttachmentKind;
  onExpand: () => void;
}) {
  const t = useTranslations("circulars");
  if (!publicUrl) return null;

  if (kind === "image") {
    return (
      <div
        onClick={onExpand}
        className="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 p-2 transition-colors hover:border-primary/50"
      >
        <Image
          src={publicUrl}
          alt={fileName}
          width={800}
          height={600}
          unoptimized
          className="max-h-[550px] w-auto max-w-full rounded-md object-contain transition-transform duration-200 group-hover:scale-[1.005]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-scrim/25 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <ZoomInIcon className="size-3.5" />
            {t("expandAttachment")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <iframe
        src={publicUrl}
        title={fileName}
        className="h-[600px] w-full border-0 bg-background"
      />
    </div>
  );
}
