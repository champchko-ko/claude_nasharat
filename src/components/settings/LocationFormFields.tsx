"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocationFormFields({
  building,
  setBuilding,
  floor,
  setFloor,
  room,
  setRoom,
  kind,
  setKind,
  disabled,
}: {
  building: string;
  setBuilding: (v: string) => void;
  floor: string;
  setFloor: (v: string) => void;
  room: string;
  setRoom: (v: string) => void;
  kind: string;
  setKind: (v: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="edit_building">{t("building")}</Label>
        <Input
          id="edit_building"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          required
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit_floor">{t("floor")}</Label>
          <Input
            id="edit_floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_room">{t("room")}</Label>
          <Input
            id="edit_room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit_kind">{t("kind")}</Label>
        <select
          id="edit_kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="room">{t("kindRoom")}</option>
          <option value="lab">{t("kindLab")}</option>
          <option value="hall">{t("kindHall")}</option>
          <option value="facility">{t("kindFacility")}</option>
          <option value="outdoor">{t("kindOutdoor")}</option>
        </select>
      </div>
    </>
  );
}
