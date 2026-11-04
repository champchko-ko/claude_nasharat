"use client";

import { useTranslations } from "next-intl";
import { PlusIcon, FolderOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SchoolDocumentsEmptyState({
  description,
  onAdd,
}: {
  description: string;
  onAdd: () => void;
}) {
  const t = useTranslations("documents");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center shadow-xs">
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-primary text-gold shadow-xs">
        <FolderOpenIcon className="size-7 text-gold" />
      </div>
      <h2 className="text-base font-bold text-foreground">{t("noDocuments")}</h2>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {description}
      </p>
      <Button onClick={onAdd} variant="outline" className="mt-5 gap-1.5 text-xs">
        <PlusIcon className="size-4 text-primary" />
        <span>{t("addDocument")}</span>
      </Button>
    </div>
  );
}
