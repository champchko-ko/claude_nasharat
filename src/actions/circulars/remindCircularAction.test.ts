import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertAuth, mockGetRecipients, mockDispatchNotification } = vi.hoisted(() => ({
  mockAssertAuth: vi.fn(),
  mockGetRecipients: vi.fn(),
  mockDispatchNotification: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/circulars/assertCanManageCirculars", () => ({
  assertCanManageCirculars: () => mockAssertAuth(),
}));

vi.mock("@/lib/circulars/getCircularReminderRecipients", () => ({
  getCircularReminderRecipients: () => mockGetRecipients(),
}));

vi.mock("@/lib/notifications/dispatchModuleNotification", () => ({
  dispatchModuleNotification: (args: unknown) => mockDispatchNotification(args),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { title: "Exam Schedule", ref_number: "CIRC-99" } }),
        }),
      }),
    }),
  }),
}));

import { remindCircularAction } from "./remindCircularAction";

describe("remindCircularAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatchNotification.mockResolvedValue({ delivered: 0 });
  });

  it("returns error if user is not authorized", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      authorized: false,
      error: "Unauthorized",
    });

    const res = await remindCircularAction({
      circularId: "circ-1",
      targetType: "pending",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized");
    expect(mockDispatchNotification).not.toHaveBeenCalled();
  });

  it("dispatches notifications to pending recipients with skipThrottle enabled", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      authorized: true,
      schoolId: "school-1",
      profileId: "admin-user",
    });
    mockGetRecipients.mockResolvedValueOnce(["user-1", "user-2", "admin-user"]);
    mockDispatchNotification.mockResolvedValueOnce({ delivered: 2 });

    const res = await remindCircularAction({
      circularId: "circ-1",
      targetType: "pending",
      customMessage: "Urgent: please confirm receipt!",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.count).toBe(2);
    }
    expect(mockDispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserIds: ["user-1", "user-2"],
        schoolId: "school-1",
        skipThrottle: true,
        body: "Urgent: please confirm receipt!",
      }),
    );
  });

  it("returns count 0 if no recipients found", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      authorized: true,
      schoolId: "school-1",
      profileId: "admin-user",
    });
    mockGetRecipients.mockResolvedValueOnce([]);

    const res = await remindCircularAction({
      circularId: "circ-1",
      targetType: "all",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.count).toBe(0);
    }
    expect(mockDispatchNotification).not.toHaveBeenCalled();
  });
});
