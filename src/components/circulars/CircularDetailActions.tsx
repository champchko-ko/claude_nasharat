"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n";
import { useTranslations } from "next-intl";
import { EditIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularPublishButton } from "./CircularPublishButton";
import { CircularRemindButton } from "./CircularRemindButton";
import { CircularDeleteDialog } from "./CircularDeleteDialog";
import type { CircularDetail } from "@/lib/circulars/getCircularById";

export function CircularDetailActions({
  circular,
  canPublish,
  canManage,
}: {
  circular: CircularDetail;
  canPublish: boolean;
  canManage: boolean;
}) {
  const t = useTranslations("circulars");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canRemind =
    circular.status !== "draft" && circular.status !== "cancelled" && (canPublish || canManage);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {circular.status === "draft" && canPublish ? (
        <CircularPublishButton circularId={circular.id} />
      ) : null}

      {canRemind ? (
        <CircularRemindButton circularId={circular.id} circularTitle={circular.title} />
      ) : null}

      {canManage ? (
        <Link href={`/circulars/${circular.id}/edit`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <EditIcon className="size-3.5" />
            <span>{t("editCircular")}</span>
          </Button>
        </Link>
      ) : null}

      {canManage ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="size-3.5" />
          <span>{tCommon("delete")}</span>
        </Button>
      ) : null}

      <CircularDeleteDialog
        circularId={circular.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/circulars")}
      />
    </div>
  );
}
