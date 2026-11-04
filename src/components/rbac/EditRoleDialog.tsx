"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateRoleAction } from "@/actions/rbac/updateRoleAction";
import type { SchoolRoleRow } from "@/lib/rbac/getSchoolRoles";
import { resolveRoleDisplayName } from "@/lib/rbac/resolveRoleDisplayName";
import { PermissionCategoriesList } from "./PermissionCategoriesList";

export function EditRoleDialog({
  role,
  isOpen,
  onClose,
}: {
  role: SchoolRoleRow;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("rbac");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const initialName = role.is_system ? resolveRoleDisplayName(role.key, t, role.name) : role.name;
  const [name, setName] = useState(initialName);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(role.permissions));
  const [isPending, startTransition] = useTransition();

  const handleToggle = (permKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(permKey)) next.delete(permKey);
      else next.add(permKey);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateRoleAction(role.id, name, Array.from(selectedKeys));
      if (res.success) {
        toast.success(tCommon("saved"));
        onClose();
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5 text-primary" />
            <span>{t("editRole")}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit_role_name">{t("roleName")}</Label>
            <Input
              id="edit_role_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("permissions")}</Label>
            <PermissionCategoriesList
              selectedKeys={selectedKeys}
              onToggle={handleToggle}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
