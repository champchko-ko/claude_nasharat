"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishCircularAction } from "@/actions/circulars/publishCircularAction";

export function CircularPublishButton({ circularId }: { circularId: string }) {
  const t = useTranslations("circulars");
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      const res = await publishCircularAction(circularId);
      if (res.success) {
        toast.success(t("publishedSuccess"));
      } else {
        toast.error(res.error ?? "Failed to publish");
      }
    });
  };

  return (
    <Button onClick={handlePublish} disabled={isPending} className="gap-2">
      <SendIcon className="size-4" />
      <span>{t("publish")}</span>
    </Button>
  );
}
