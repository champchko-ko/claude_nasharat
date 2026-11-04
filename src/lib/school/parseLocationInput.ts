export function parseLocationInput(
  building: string,
  floor: string | null,
  room: string | null,
  kind: string,
) {
  const trimmedBuilding = building.trim();
  const trimmedFloor = floor ? floor.trim() : null;
  const trimmedRoom = room ? room.trim() : null;
  const trimmedKind = kind.trim() || "room";

  return {
    building: trimmedBuilding,
    floor: trimmedFloor || null,
    room: trimmedRoom || null,
    kind: trimmedKind,
  };
}
