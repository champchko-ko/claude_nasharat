import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";

export function SchoolContactFields({
  school,
  canManage,
}: {
  school: SchoolFullDetails;
  canManage: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <>
      <div className="border-t border-border pt-2 sm:col-span-2">
        <h3 className="text-sm font-semibold text-foreground">{t("contactAndLocation")}</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={school.phone ?? ""}
          placeholder="+966 12 345 6789"
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          defaultValue={school.email ?? ""}
          placeholder="info@school.edu"
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_ar">{t("addressAr")}</Label>
        <Input
          id="address_ar"
          name="address_ar"
          defaultValue={school.address_ar ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_en">{t("addressEn")}</Label>
        <Input
          id="address_en"
          name="address_en"
          defaultValue={school.address_en ?? ""}
          disabled={!canManage}
        />
      </div>
    </>
  );
}
