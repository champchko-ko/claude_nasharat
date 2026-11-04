import { describe, expect, it } from "vitest";
import { fetchCircularBaseRow } from "./fetchCircularBaseRow";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("fetchCircularBaseRow", () => {
  it("returns row when primary select succeeds", async () => {
    const mockClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: "c-1", title: "Test", visibility: "internal" },
                error: null,
              }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const row = await fetchCircularBaseRow(mockClient, "c-1");
    expect(row).toEqual({ id: "c-1", title: "Test", visibility: "internal" });
  });

  it("falls back when visibility column does not exist", async () => {
    let callCount = 0;
    const mockClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: null,
                  error: { code: "42703", message: "column visibility does not exist" },
                });
              }
              return Promise.resolve({ data: { id: "c-1", title: "Test" }, error: null });
            },
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const row = await fetchCircularBaseRow(mockClient, "c-1");
    expect(row).toEqual({ id: "c-1", title: "Test", visibility: "internal" });
  });
});
