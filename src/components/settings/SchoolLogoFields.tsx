"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageIcon, UploadIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getSchoolLogoUrl } from "@/lib/school/getSchoolLogoUrl";

export function SchoolLogoFields({
  logoPath,
  canManage,
}: {
  logoPath?: string | null;
  canManage: boolean;
}) {
  const t = useTranslations("settings");
  const [preview, setPreview] = useState<string | null>(null);

  const currentLogoUrl = getSchoolLogoUrl(logoPath);
  const displayUrl = preview ?? currentLogoUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-2 sm:col-span-2">
      <Label htmlFor="logo" className="text-sm font-semibold text-foreground">
        {t("logo")}
      </Label>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/50 shadow-inner">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Logo preview"
              width={80}
              height={80}
              unoptimized
              className="size-full object-contain p-1"
            />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground/60" />
          )}
        </div>
        <div className="w-full flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!canManage}
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer file:font-medium"
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <UploadIcon className="size-3" />
            <span>{t("logoHint")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
