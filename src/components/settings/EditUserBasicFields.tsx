"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditUserBasicFields({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  jobTitle,
  setJobTitle,
  disabled,
}: {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("settings");
  const tHome = useTranslations("home");

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="edit_user_name">{t("fullName")}</Label>
        <Input
          id="edit_user_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit_user_email">{tHome("email")}</Label>
          <Input
            id="edit_user_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit_user_phone">{t("phone")}</Label>
          <Input
            id="edit_user_phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit_user_job">{t("jobTitle")}</Label>
        <Input
          id="edit_user_job"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
}
