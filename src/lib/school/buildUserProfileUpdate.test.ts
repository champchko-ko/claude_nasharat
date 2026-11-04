import { describe, it, expect } from "vitest";
import { buildUserProfileUpdate } from "./buildUserProfileUpdate";

describe("buildUserProfileUpdate", () => {
  it("omits is_active when isActive is undefined so deactivated users stay deactivated", () => {
    const result = buildUserProfileUpdate({
      fullName: "Ahmed Ali",
      jobTitle: "Teacher",
    });

    expect(result.full_name).toBe("Ahmed Ali");
    expect(result.job_title).toBe("Teacher");
    expect("is_active" in result).toBe(false);
  });

  it("sets is_active to true when explicitly provided as true", () => {
    const result = buildUserProfileUpdate({
      fullName: "Ahmed Ali",
      isActive: true,
    });

    expect(result.is_active).toBe(true);
  });

  it("sets is_active to false when explicitly provided as false", () => {
    const result = buildUserProfileUpdate({
      fullName: "Ahmed Ali",
      isActive: false,
    });

    expect(result.is_active).toBe(false);
  });
});
