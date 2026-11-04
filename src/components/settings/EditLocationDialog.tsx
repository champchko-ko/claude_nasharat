"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateLocationAction } from "@/actions/settings/updateLocationAction";
import type { LocationRow } from "@/lib/school/getSchoolLocations";
import { LocationFormFields } from "./LocationFormFields";

export function EditLocationDialog({
  location,
  isOpen,
  onClose,
}: {
  location: LocationRow;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [building, setBuilding] = useState(location.building);
  const [floor, setFloor] = useState(location.floor ?? "");
  const [room, setRoom] = useState(location.room ?? "");
  const [kind, setKind] = useState(location.kind);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateLocationAction(location.id, building, floor, room, kind);
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
          <DialogTitle>{t("editLocation")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <LocationFormFields
            building={building}
            setBuilding={setBuilding}
            floor={floor}
            setFloor={setFloor}
            room={room}
            setRoom={setRoom}
            kind={kind}
            setKind={setKind}
            disabled={isPending}
          />
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
