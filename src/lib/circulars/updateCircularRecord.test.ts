import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCircularRecord } from "./updateCircularRecord";

function makeClient({
  deleteError = null,
  insertError = null,
}: {
  deleteError?: { message: string } | null;
  insertError?: { message: string; code?: string } | null;
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const deleteEq = vi.fn().mockResolvedValue({ error: deleteError });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi.fn((table: string) => {
    if (table === "circulars") return { update };
    return { delete: () => ({ eq: deleteEq }), insert };
  });

  return { client: { from } as unknown as SupabaseClient, insert, deleteEq, updateEq };
}

const baseParams = {
  circularId: "circ-1",
  schoolId: "school-1",
  title: "Title",
  body: "Body",
  priority: "normal" as const,
  responseType: "acknowledgement" as const,
  dueAt: null,
  departmentIds: ["dept-1", "dept-1", "dept-2"],
};

describe("updateCircularRecord", () => {
  it("surfaces a failed target delete instead of reporting success", async () => {
    const { client } = makeClient({ deleteError: { message: "delete denied" } });

    const result = await updateCircularRecord(client, baseParams);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/delete denied/);
  });

  it("surfaces a failed target insert", async () => {
    const { client } = makeClient({ insertError: { message: "insert denied" } });

    const result = await updateCircularRecord(client, baseParams);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/insert denied/);
  });

  it("replaces the targets and de-duplicates the selection", async () => {
    const { client, insert, deleteEq } = makeClient();

    const result = await updateCircularRecord(client, baseParams);

    expect(result).toEqual({ success: true });
    expect(deleteEq).toHaveBeenCalledWith("circular_id", "circ-1");
    expect(insert).toHaveBeenCalledWith([
      { circular_id: "circ-1", school_id: "school-1", department_id: "dept-1" },
      { circular_id: "circ-1", school_id: "school-1", department_id: "dept-2" },
    ]);
  });
});
