import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteCircularRecord } from "./deleteCircularRecord";

function makeClient({
  attachments = [{ path: "school-1/circ-1/a.pdf" }],
  removeError = null,
  deleted = { id: "circ-1" },
}: {
  attachments?: { path: string }[];
  removeError?: { message: string } | null;
  deleted?: { id: string } | null;
} = {}) {
  const remove = vi.fn().mockResolvedValue({ error: removeError });
  const maybeSingle = vi.fn().mockResolvedValue({ data: deleted, error: null });
  const deleteEq = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
  const from = vi.fn((table: string) => {
    if (table === "circular_attachments") {
      return { select: () => ({ eq: () => Promise.resolve({ data: attachments, error: null }) }) };
    }
    return { delete: () => ({ eq: deleteEq }) };
  });

  return {
    client: { storage: { from: () => ({ remove }) }, from } as unknown as SupabaseClient,
    remove,
    deleteEq,
  };
}

describe("deleteCircularRecord", () => {
  it("aborts when the stored attachments cannot be removed", async () => {
    const { client, remove, deleteEq } = makeClient({ removeError: { message: "denied" } });

    const result = await deleteCircularRecord(client, "circ-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/denied/);
    expect(remove).toHaveBeenCalledWith(["school-1/circ-1/a.pdf"]);
    expect(deleteEq).not.toHaveBeenCalled();
  });

  it("reports a delete that matched no row as a failure", async () => {
    const { client } = makeClient({ deleted: null });

    const result = await deleteCircularRecord(client, "circ-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Circular not found or not permitted");
  });

  it("removes the objects and the circular together", async () => {
    const { client, remove } = makeClient();

    const result = await deleteCircularRecord(client, "circ-1");

    expect(result).toEqual({ success: true });
    expect(remove).toHaveBeenCalledWith(["school-1/circ-1/a.pdf"]);
  });
});
