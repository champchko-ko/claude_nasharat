import { describe, it, expect, vi } from "vitest";
import { getCurrentProfile } from "./getCurrentProfile";
import { createSupabaseServerClient } from "@/lib/supabase";
import { DatabaseError } from "@/lib/errors/DatabaseError";

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(),
}));

type MockServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "database timeout", code: "PGRST001" },
            }),
          }),
        }),
      }),
    } as unknown as MockServerClient);

    await expect(getCurrentProfile()).rejects.toThrow(DatabaseError);
  });

  it("returns mapped ProfileRow when query succeeds", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "u-1",
                full_name: "Ahmed Ali",
                email: "ahmed@example.com",
                job_title: "Teacher",
                school_id: "s-1",
                department_id: "d-1",
                is_active: true,
                departments: { id: "d-1", name_ar: "العلوم", name_en: "Science" },
              },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as MockServerClient);

    const profile = await getCurrentProfile();
    expect(profile).not.toBeNull();
    expect(profile?.full_name).toBe("Ahmed Ali");
    expect(profile?.department_name_ar).toBe("العلوم");
  });
});
