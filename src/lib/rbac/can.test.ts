import { describe, expect, it } from "vitest";
import { can } from "./can";

describe("can", () => {
  it("grants only listed permissions", () => {
    expect(can(["maintenance.create"], "maintenance.create")).toBe(true);
    expect(can(["maintenance.create"], "circular.publish")).toBe(false);
    expect(can([], "circular.publish")).toBe(false);
  });
});
