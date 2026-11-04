"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SchoolDocumentTextInputs({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: {
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
}) {
  const t = useTranslations("documents");

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {t("documentTitle")} <span className="text-destructive">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("documentTitlePlaceholder")}
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">{t("documentDescription")}</label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t("documentDescriptionPlaceholder")}
          rows={3}
          className="resize-none text-sm"
        />
      </div>
    </>
  );
}
