import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRetryResponseWithAdmin = vi.fn().mockResolvedValue(undefined);
vi.mock("./retryResponseWithAdmin", () => ({
  retryResponseWithAdmin: (...args: unknown[]) => mockRetryResponseWithAdmin(...args),
}));

import { executeSubmitCircularResponse } from "./executeSubmitCircularResponse";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("executeSubmitCircularResponse", () => {
  it("calls RPC successfully when RPC is available", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    await expect(
      executeSubmitCircularResponse({
        supabase,
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "acknowledgement",
        status: "acknowledged",
        reason: "  all clear  ",
      }),
    ).resolves.toBeUndefined();

    expect(rpcMock).toHaveBeenCalledWith("submit_circular_response", {
      p_circular_id: "circ-1",
      p_department_id: "dept-1",
      p_response_type: "acknowledgement",
      p_status: "acknowledged",
      p_reason: "all clear",
    });
  });

  it("falls back to direct table update and insert when RPC returns PGRST202", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: { code: "PGRST202", message: "function not found in schema cache" },
    });

    const eqSecondMock = vi.fn().mockResolvedValue({ error: null });
    const eqFirstMock = vi.fn().mockReturnValue({ eq: eqSecondMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqFirstMock });
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "circular_responses") {
        return {
          update: updateMock,
          insert: insertMock,
        };
      }
      return {};
    });

    const supabase = {
      rpc: rpcMock,
      from: fromMock,
    } as unknown as SupabaseClient;

    await expect(
      executeSubmitCircularResponse({
        supabase,
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "acknowledgement",
        status: "acknowledged",
        reason: null,
      }),
    ).resolves.toBeUndefined();

    expect(updateMock).toHaveBeenCalledWith({ is_latest: false });
    expect(eqFirstMock).toHaveBeenCalledWith("circular_id", "circ-1");
    expect(eqSecondMock).toHaveBeenCalledWith("department_id", "dept-1");

    expect(insertMock).toHaveBeenCalledWith({
      circular_id: "circ-1",
      department_id: "dept-1",
      responder_id: "user-1",
      response_type: "acknowledgement",
      status: "acknowledged",
      reason: null,
      is_latest: true,
    });
  });

  it("retries with admin client when fallback insert fails with 23505 conflict", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: { code: "PGRST202", message: "function not found in schema cache" },
    });

    const eqSecondMock = vi.fn().mockResolvedValue({ error: null });
    const eqFirstMock = vi.fn().mockReturnValue({ eq: eqSecondMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqFirstMock });
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate key value" },
    });

    const supabase = {
      rpc: rpcMock,
      from: vi.fn().mockReturnValue({
        update: updateMock,
        insert: insertMock,
      }),
    } as unknown as SupabaseClient;

    await expect(
      executeSubmitCircularResponse({
        supabase,
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "task",
        status: "completed",
        reason: null,
      }),
    ).resolves.toBeUndefined();

    expect(mockRetryResponseWithAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        circularId: "circ-1",
        status: "completed",
      }),
    );
  });

  it("throws mapped database error when fallback insert fails with non-conflict error", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: { code: "PGRST202", message: "function not found in schema cache" },
    });

    const eqSecondMock = vi.fn().mockResolvedValue({ error: null });
    const eqFirstMock = vi.fn().mockReturnValue({ eq: eqSecondMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqFirstMock });
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: "42501", message: "Permission denied" },
    });

    const supabase = {
      rpc: rpcMock,
      from: vi.fn().mockReturnValue({
        update: updateMock,
        insert: insertMock,
      }),
    } as unknown as SupabaseClient;

    await expect(
      executeSubmitCircularResponse({
        supabase,
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "acknowledgement",
        status: "acknowledged",
      }),
    ).rejects.toThrow("Insufficient permissions to complete operation");
  });

  it("throws mapped database error when RPC fails with non-PGRST202 error", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      error: { code: "42501", message: "Unauthorized caller" },
    });

    const supabase = {
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    await expect(
      executeSubmitCircularResponse({
        supabase,
        circularId: "circ-1",
        schoolId: "school-1",
        departmentId: "dept-1",
        responderId: "user-1",
        responseType: "acknowledgement",
        status: "acknowledged",
      }),
    ).rejects.toThrow("Insufficient permissions to complete operation");
  });
});
