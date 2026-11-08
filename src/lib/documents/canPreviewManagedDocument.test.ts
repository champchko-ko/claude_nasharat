import { describe, expect, it } from "vitest";
import { canPreviewManagedDocument } from "./canPreviewManagedDocument";

describe("canPreviewManagedDocument", () => {
  it("allows an authorized user regardless of the legacy scope value", () => {
    expect(
      canPreviewManagedDocument(
        {
          allowed: true,
          profile: {
            id: "user-1",
            email: "owner@example.test",
            full_name: "Owner",
            job_title: null,
            department_id: null,
            is_active: true,
          },
          schoolId: "actual-school-uuid",
          isOwner: true,
        },
        "singleton",
      ),
    ).toBe(true);
  });

  it("denies unauthenticated or unauthorized users", () => {
    expect(
      canPreviewManagedDocument(
        { allowed: false, profile: null, schoolId: null, isOwner: false },
        "singleton",
      ),
    ).toBe(false);
  });
});
