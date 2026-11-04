import { describe, it, expect, vi } from "vitest";
import { deleteMaintenanceRequestRecord } from "./deleteMaintenanceRequestRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("deleteMaintenanceRequestRecord", () => {
  it("returns error if reading attachments fails", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "Read error" } }),
        }),
      }),
    } as unknown as SupabaseClient;

    const res = await deleteMaintenanceRequestRecord(client, "req-1");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Read error");
  });

  it("successfully deletes request and its attachments", async () => {
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "req-1" }, error: null }),
        }),
      }),
    });

    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "maintenance_attachments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ path: "p1" }, { path: "p2" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "maintenance_requests") {
          return { delete: deleteMock };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({ remove: removeMock }),
      },
    } as unknown as SupabaseClient;

    const res = await deleteMaintenanceRequestRecord(client, "req-1");
    expect(res.success).toBe(true);
    expect(removeMock).toHaveBeenCalledWith(["p1", "p2"]);
  });
});

