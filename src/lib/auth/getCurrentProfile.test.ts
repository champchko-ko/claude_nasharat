import { describe, it, expect, vi } from "vitest";
import { getCurrentProfile } from "./getCurrentProfile";
import { createSupabaseServerClient } from "@/lib/supabase";
import { DatabaseError } from "@/lib/errors/DatabaseError";

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(),
}));

type MockServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function clientWithProfileQuery(result: unknown, selectSpy = vi.fn()) {
  selectSpy.mockReturnValue({
    eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue(result) }),
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } }, error: null }),
    },
    from: vi.fn().mockReturnValue({ select: selectSpy }),
  } as unknown as MockServerClient);
  return selectSpy;
}

describe("getCurrentProfile", () => {
  it("returns null when user is not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as unknown as MockServerClient);

    const profile = await getCurrentProfile();
    expect(profile).toBeNull();
  });

  it("throws DatabaseError when profiles query fails", async () => {
    clientWithProfileQuery({
      data: null,
      error: { message: "database timeout", code: "PGRST001" },
    });

    await expect(getCurrentProfile()).rejects.toThrow(DatabaseError);
  });

  it("returns mapped ProfileRow when query succeeds", async () => {
    clientWithProfileQuery({
      data: {
        id: "u-1",
        full_name: "Ahmed Ali",
        email: "ahmed@example.com",
        job_title: "Teacher",
        department_id: "d-1",
        is_active: true,
        departments: { id: "d-1", name_ar: "العلوم", name_en: "Science" },
      },
      error: null,
    });

    const profile = await getCurrentProfile();
    expect(profile).not.toBeNull();
    expect(profile?.full_name).toBe("Ahmed Ali");
    expect(profile?.department_name_ar).toBe("العلوم");
  });

  it("does not ask the database for a school id; the legacy field is always null", async () => {
    const selectSpy = clientWithProfileQuery({
      data: {
        id: "u-1",
        full_name: "Ahmed Ali",
        email: null,
        job_title: null,
        department_id: null,
        is_active: true,
        departments: null,
      },
      error: null,
    });

    await getCurrentProfile();

    expect(selectSpy.mock.calls[0][0]).not.toContain("tenant_id");
  });
});
