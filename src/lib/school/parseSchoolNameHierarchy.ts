export function parseSchoolNameHierarchy(rawName?: string | null): {
  hierarchy: string | null;
  primaryName: string;
} {
  if (!rawName || !rawName.trim()) {
    return { hierarchy: null, primaryName: "" };
  }

  const lines = rawName
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { hierarchy: null, primaryName: "" };
  }

  if (lines.length === 1) {
    return { hierarchy: null, primaryName: lines[0] };
  }

  const hierarchy = lines.slice(0, -1).join(" • ");
  const primaryName = lines[lines.length - 1];

  return { hierarchy, primaryName };
}
