import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, mockOwnerIds } = vi.hoisted(() => ({ from: vi.fn(), mockOwnerIds: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(() => ({ from })),
}));
vi.mock("@/lib/auth/getPlatformOwnerUserIds", () => ({
  getPlatformOwnerUserIds: () => mockOwnerIds(),
}));

import { getSchoolUsers } from "./getSchoolUsers";

const row = (id: string, key: string) => ({
  id,
  full_name: `User ${id}`,
  email: null,
  phone: null,
  job_title: null,
  department_id: null,
  is_active: true,
  departments: null,
  user_role_assignments: [{ roles: { key } }],
});

function profilesQuery(result: { data: unknown; error: unknown }) {
  const select = vi.fn(() => ({ order: () => Promise.resolve(result) }));
  from.mockReturnValue({ select });
  return select;
}

describe("getSchoolUsers", () => {
  beforeEach(() => {
    from.mockReset();
    mockOwnerIds.mockReset();
    mockOwnerIds.mockResolvedValue(new Set<string>());
  });

  it("lists users without any school filter and ignores the legacy argument", async () => {
    const select = profilesQuery({ data: [row("a", "staff"), row("b", "operator")], error: null });

    const users = await getSchoolUsers("legacy-school-id");

    expect(users.map((u) => u.id)).toEqual(["a", "b"]);
    expect(select).toHaveBeenCalledWith(expect.stringContaining("roles(key)"));
    expect(select).toHaveBeenCalledWith(expect.not.stringContaining("tenant_id"));
  });

  it("hides owner accounts", async () => {
    profilesQuery({ data: [row("o", "owner"), row("a", "staff")], error: null });
    mockOwnerIds.mockResolvedValue(new Set(["o"]));

    const users = await getSchoolUsers();

    expect(users.map((u) => u.id)).toEqual(["a"]);
  });

  it("throws when the query fails", async () => {
    profilesQuery({ data: null, error: { message: "boom", code: "XX000" } });

    await expect(getSchoolUsers()).rejects.toThrow();
  });
});
