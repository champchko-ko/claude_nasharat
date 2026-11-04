import { locationSchema } from "./locationSchema";
import { formatZodError } from "./formatZodError";

export function parseLocationFormData(formData: FormData) {
  const get = (key: string) => {
    const val = formData.get(key);
    return typeof val === "string" ? val.trim() : "";
  };

  const rawInput = {
    building: get("building"),
    floor: get("floor") || null,
    room: get("room") || null,
    kind: get("kind") || "room",
  };

  const parsed = locationSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }

  return parsed.data;
}
