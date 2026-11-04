"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserBasicFields({
  fullName,
  setFullName,
  email,
  setEmail,
  jobTitle,
  setJobTitle,
  disabled,
}: {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="new_user_name">{t("fullName")}</Label>
        <Input
          id="new_user_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("fullName")}
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new_user_email">{t("email")}</Label>
        <Input
          id="new_user_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@school.edu"
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new_user_job">{t("jobTitle")}</Label>
        <Input
          id="new_user_job"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder={t("jobTitle")}
          disabled={disabled}
        />
      </div>
    </>
  );
}
