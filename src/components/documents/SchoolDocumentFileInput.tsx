"use client";

import { useTranslations } from "next-intl";
import { FileTextIcon, UploadCloudIcon } from "lucide-react";

export function SchoolDocumentFileInput({
  isEditing,
  currentFileName,
  onFileChange,
}: {
  isEditing: boolean;
  currentFileName?: string;
  onFileChange: (file: File | null) => void;
}) {
  const t = useTranslations("documents");

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">
        {t("selectFile")} {!isEditing ? <span className="text-destructive">*</span> : null}
      </label>

      {isEditing && currentFileName ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
          <FileTextIcon className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {t("currentFile")}:{" "}
            <span className="font-semibold text-primary">{currentFileName}</span>
          </span>
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/40">
        <UploadCloudIcon className="mb-1.5 size-7 text-primary" />
        <input
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="cursor-pointer text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          {isEditing ? t("replaceFileHelp") : t("fileHelp")}
        </p>
      </div>
    </div>
  );
}
