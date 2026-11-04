"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BellRingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularRemindModal } from "./CircularRemindModal";

export function CircularRemindButton({
  circularId,
  circularTitle,
  variant = "outline",
  size = "sm",
  className,
}: {
  circularId?: string | null;
  circularTitle?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const t = useTranslations("circulars");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} className={className}>
        <BellRingIcon className="size-3.5 text-inherit" />
        <span>{t("urgePending")}</span>
      </Button>

      <CircularRemindModal
        circularId={circularId}
        circularTitle={circularTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
