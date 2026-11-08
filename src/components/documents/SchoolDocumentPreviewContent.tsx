"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FileTextIcon } from "lucide-react";
import type { SchoolDocumentRow } from "@/lib/documents/types";
import { PdfDocumentPreview } from "./PdfDocumentPreview";

export function SchoolDocumentPreviewContent({
  currentDoc,
}: {
  currentDoc?: SchoolDocumentRow | null;
}) {
  const t = useTranslations("documents");
  const fileUrl = currentDoc?.file_url;
  const isImage = currentDoc?.mime_type?.startsWith("image/");

  if (!currentDoc || !fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileTextIcon className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">{t("noDocumentsPublic")}</p>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex w-full justify-center">
        <Image
          src={fileUrl}
          alt={currentDoc.title}
          width={1000}
          height={800}
          unoptimized
          className="max-h-[68vh] w-auto max-w-full rounded-lg border border-border/80 object-contain shadow-md"
        />
      </div>
    );
  }

  if (currentDoc.mime_type === "application/pdf" || /\.pdf(?:$|\?)/i.test(fileUrl)) {
    return <PdfDocumentPreview fileUrl={fileUrl} title={currentDoc.title} />;
  }

  return (
    <iframe
      src={fileUrl}
      title={currentDoc.title}
      className="h-[68vh] w-full rounded-lg border border-border/80 bg-white"
    />
  );
}
