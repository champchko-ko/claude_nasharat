"use client";

import { useTranslations } from "next-intl";
import { SaveIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditCircularActions({
  isPending,
  onCancel,
}: {
  isPending: boolean;
  onCancel: () => void;
}) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
        {tCommon("cancel")}
      </Button>
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SaveIcon className="size-4" />
        )}
        <span>{tCommon("save")}</span>
      </Button>
    </div>
  );
}
