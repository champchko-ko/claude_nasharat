import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const { mockSync } = vi.hoisted(() => ({ mockSync: vi.fn() }));

vi.mock("./syncAuthUserUpdates", () => ({
  syncAuthUserUpdates: (...args: unknown[]) => mockSync(...args),
}));

import { persistUserUpdates } from "./persistUserUpdates";

const previous = {
  full_name: "Old Name",
  email: "old@example.com",
  phone: null,
  job_title: null,
  department_id: null,
  is_active: true,
};

function buildClient(opts: { previous: unknown; updated: unknown }) {
  const restoreEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi
    .fn()
    .mockReturnValueOnce({
      eq: () => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: opts.updated, error: null }) }) }),
    })
    .mockReturnValue({ eq: restoreEq });
  const client = {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.previous, error: null }) }),
      }),
      update,
    })),
  } as unknown as SupabaseClient;
  return { client, update, restoreEq };
}

const input = { userId: "u1", fullName: "New Name", email: "new@example.com" };

describe("persistUserUpdates", () => {
  beforeEach(() => {
    mockSync.mockReset();
    mockSync.mockResolvedValue({ success: true });
  });

  it("updates the profile and then the auth user", async () => {
    const { client, update } = buildClient({ previous, updated: { id: "u1" } });

    await expect(persistUserUpdates(client, input)).resolves.toEqual({ success: true });

    expect(update).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledWith(client, "u1", "new@example.com", undefined);
  });

  it("reports an unknown user without touching auth", async () => {
    const { client } = buildClient({ previous: null, updated: null });

    await expect(persistUserUpdates(client, input)).resolves.toEqual({
      success: false,
      error: "User not found",
    });
    expect(mockSync).not.toHaveBeenCalled();
  });

  it("restores the profile when the auth update fails", async () => {
    mockSync.mockResolvedValue({ success: false, error: "auth failed" });
    const { client, update, restoreEq } = buildClient({ previous, updated: { id: "u1" } });

    await expect(persistUserUpdates(client, input)).resolves.toEqual({
      success: false,
      error: "auth failed",
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1][0]).toMatchObject({ full_name: "Old Name", email: "old@example.com" });
    expect(restoreEq).toHaveBeenCalledWith("id", "u1");
  });
});
