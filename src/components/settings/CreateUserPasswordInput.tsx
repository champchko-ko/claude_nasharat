"use client";

import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserPasswordInput({
  password,
  setPassword,
  disabled,
}: {
  password: string;
  setPassword: (val: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("settings");

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="new_user_password">{t("password")}</Label>
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
        id="new_user_password"
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("passwordMinLength")}
        required
        minLength={6}
        disabled={disabled}
      />
    </div>
  );
}
