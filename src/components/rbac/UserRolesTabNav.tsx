"use client";

import { useTranslations } from "next-intl";
import { UsersIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserRolesTabNav({
  activeTab,
  onTabChange,
  showUsers = true,
  showRoles = true,
}: {
  activeTab: "users" | "roles";
  onTabChange: (tab: "users" | "roles") => void;
  showUsers?: boolean;
  showRoles?: boolean;
}) {
  const t = useTranslations("rbac");

  // If only one tab is available (e.g. roles are hidden for admins), do not display tab navigation
  if (!showRoles || !showUsers) {
    return null;
  }

  return (
    <div className="flex gap-2 border-b border-border">
      <Button
        variant={activeTab === "users" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("users")}
        className="gap-2 rounded-b-none"
      >
        <UsersIcon className="size-4" />
        <span>{t("tabUsers")}</span>
      </Button>
      <Button
        variant={activeTab === "roles" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTabChange("roles")}
        className="gap-2 rounded-b-none"
      >
        <ShieldCheckIcon className="size-4" />
        <span>{t("tabRoles")}</span>
      </Button>
    </div>
  );
}
