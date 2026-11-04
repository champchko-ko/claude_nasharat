import type {
  CircularPriority,
  CircularResponseType,
  CircularVisibility,
} from "@/lib/circulars/types";
import { circularSchema } from "./circularSchema";
import { formatZodError } from "./formatZodError";

export function parseCircularFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  const departmentIds = formData.getAll("department_ids").map(String).filter(Boolean);

  const rawInput = {
    title: get("title"),
    body: get("body"),
    priority: get("priority") || "normal",
    visibility: get("visibility") || "internal",
    responseType: get("response_type") || "acknowledgement",
    dueAt: get("due_at") || null,
    publishAt: get("publish_at") || null,
    departmentIds,
  };

  const parsed = circularSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }

  return {
    ...parsed.data,
    priority: parsed.data.priority as CircularPriority,
    visibility: parsed.data.visibility as CircularVisibility,
    responseType: parsed.data.responseType as CircularResponseType,
    status: get("status") || undefined,
  };
}
