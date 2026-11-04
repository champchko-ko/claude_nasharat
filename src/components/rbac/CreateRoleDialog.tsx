"use client";

import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateRoleForm } from "./CreateRoleForm";

export function CreateRoleDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations("rbac");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="size-5 text-primary" />
            <span>{t("createRole")}</span>
          </DialogTitle>
        </DialogHeader>
        <CreateRoleForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
