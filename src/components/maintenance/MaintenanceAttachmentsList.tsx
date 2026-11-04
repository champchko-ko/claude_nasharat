"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLinkIcon, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GoldDots } from "@/components/ui/gold-dots";
import type { MaintenanceAttachmentRow } from "@/lib/maintenance/types";

export function MaintenanceAttachmentsList({
  attachments,
}: {
  attachments: MaintenanceAttachmentRow[];
}) {
  const t = useTranslations("maintenance");

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <ImageIcon className="size-5 text-primary" />
        <h3 className="font-heading font-extrabold text-primary">{t("attachments")}</h3>
        <GoldDots />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 p-2 transition hover:shadow-sm"
          >
            {att.public_url ? (
              <div className="aspect-video w-full overflow-hidden rounded-md bg-scrim/5">
                <Image
                  src={att.public_url}
                  alt={att.kind}
                  width={400}
                  height={225}
                  unoptimized
                  className="size-full object-cover transition group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ImageIcon className="size-8" />
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-xs">
              <Badge variant="outline" className="text-[10px]">
                {att.kind === "report" ? t("reportPhoto") : t("evidencePhoto")}
              </Badge>
              {att.public_url && (
                <a
                  href={att.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLinkIcon className="size-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
