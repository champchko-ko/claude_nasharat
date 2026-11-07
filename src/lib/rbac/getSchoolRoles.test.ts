import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(() => ({ from })),
}));

import { getSchoolRoles } from "./getSchoolRoles";

function rolesTable(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      neq: () => ({ order: () => ({ order: () => Promise.resolve(result) }) }),
    }),
  };
}

describe("getSchoolRoles", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("maps roles with permissions and user counts and uses the Arabic name for display", async () => {
    from.mockImplementation((table: string) => {
      if (table === "roles") {
        return rolesTable({
          data: [
            {
              id: "r1",
              key: "staff",
              name_ar: "موظف",
              name_en: "Staff",
              is_system: true,
              is_locked: false,
              requires_department: true,
              created_at: "2026-01-01",
            },
          ],
          error: null,
        });
      }
      if (table === "role_permissions") {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [{ role_id: "r1", permission_key: "maintenance.create" }],
                error: null,
              }),
          }),
        };
      }
      return {
        select: () =>
          Promise.resolve({ data: [{ role_id: "r1" }, { role_id: "r1" }], error: null }),
      };
    });

    const roles = await getSchoolRoles();

    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({
      key: "staff",
      name: "موظف",
      name_en: "Staff",
      permissions: ["maintenance.create"],
      user_count: 2,
      requires_department: true,
    });
  });

  it("returns an empty list when there are no roles", async () => {
    from.mockImplementation(() => rolesTable({ data: [], error: null }));
    await expect(getSchoolRoles()).resolves.toEqual([]);
  });

  it("throws instead of hiding a database failure", async () => {
    from.mockImplementation(() =>
      rolesTable({ data: null, error: { message: "boom", code: "XX000" } }),
    );
    await expect(getSchoolRoles()).rejects.toThrow();
  });
});
