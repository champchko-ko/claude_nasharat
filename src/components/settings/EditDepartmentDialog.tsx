"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateDepartmentAction } from "@/actions/settings/updateDepartmentAction";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function EditDepartmentDialog({
  department,
  isOpen,
  onClose,
}: {
  department: DepartmentRow;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [nameAr, setNameAr] = useState(department.name_ar);
  const [nameEn, setNameEn] = useState(department.name_en);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateDepartmentAction(department.id, nameAr, nameEn);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editDepartment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit_dept_ar">{t("deptNameAr")}</Label>
            <Input
              id="edit_dept_ar"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_dept_en">{t("deptNameEn")}</Label>
            <Input
              id="edit_dept_en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
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
