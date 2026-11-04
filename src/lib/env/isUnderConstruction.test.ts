import { describe, it, expect } from "vitest";
import { isUnderConstruction } from "./isUnderConstruction";

describe("isUnderConstruction", () => {
  it("returns false as under construction is cancelled for now", async () => {
    const result = await isUnderConstruction();
    expect(result).toBe(false);
  });
});
