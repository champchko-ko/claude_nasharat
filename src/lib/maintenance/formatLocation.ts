export function formatLocation(
  location?: {
    building: string;
    floor: string | null;
    room: string | null;
  } | null,
): string {
  if (!location) return "—";
  const parts = [location.building];
  if (location.floor) parts.push(location.floor);
  if (location.room) parts.push(location.room);
  return parts.join(" · ");
}
