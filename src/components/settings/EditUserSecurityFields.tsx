"use client";

import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditUserSecurityFields({
  password,
  setPassword,
  isActive,
  setIsActive,
  disabled,
}: {
  password: string;
  setPassword: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  disabled: boolean;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit_user_password">{t("password")}</Label>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
          >
            <SparklesIcon className="size-3" />
            <span>{t("generatePassword")}</span>
          </button>
        </div>
        <Input
          id="edit_user_password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("leaveBlankPassword")}
          minLength={6}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit_user_status">{t("accountStatus")}</Label>
        <select
          id="edit_user_status"
          value={isActive ? "active" : "inactive"}
          onChange={(e) => setIsActive(e.target.value === "active")}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="active">{tCommon("active")}</option>
          <option value="inactive">{tCommon("inactive")}</option>
        </select>
      </div>
    </>
  );
}
