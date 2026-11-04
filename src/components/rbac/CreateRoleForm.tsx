"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction } from "@/actions/rbac/createRoleAction";
import { PermissionCategoriesList } from "./PermissionCategoriesList";

export function CreateRoleForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("rbac");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
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
      const res = await createRoleAction(name, key, Array.from(selectedKeys));
      if (res.success) {
        toast.success(tCommon("saved"));
        setName("");
        setKey("");
        setSelectedKeys(new Set());
        onClose();
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="new_role_name">{t("roleName")}</Label>
          <Input
            id="new_role_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("roleNamePlaceholder")}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new_role_key">{t("roleKey")}</Label>
          <Input
            id="new_role_key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={t("roleKeyPlaceholder")}
            required
            disabled={isPending}
          />
        </div>
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
  );
}
