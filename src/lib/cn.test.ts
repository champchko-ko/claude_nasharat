import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn helper", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional class values", () => {
    const isPrimary = true;
    const isSecondary = false;
    expect(cn("base-btn", isPrimary && "btn-primary", isSecondary && "btn-secondary")).toBe(
      "base-btn btn-primary",
    );
  });

  it("handles arrays, objects, null, and undefined values", () => {
    expect(cn(["a", "b"], { c: true, d: false }, null, undefined, false, "e")).toBe("a b c e");
  });

  it("resolves Tailwind conflicting classes using twMerge rules", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("h-8", "h-9")).toBe("h-9");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
