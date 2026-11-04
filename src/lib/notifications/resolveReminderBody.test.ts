import { describe, it, expect } from "vitest";
import { resolveReminderBody } from "./resolveReminderBody";

describe("resolveReminderBody", () => {
  const mockT = (key: string, values?: Record<string, string | number>) => {
    if (key === "templates.circular_reminder.bodyWithRef") {
      return `Review circular #${values?.ref} (${values?.title})`;
    }
    if (key === "templates.circular_reminder.bodyDefault") {
      return "Review pending circulars";
    }
    return key;
  };

  it("formats structured JSON payload with ref and title", () => {
    const payload = JSON.stringify({ ref: "CIRC-101", title: "Safety Protocol" });
    const result = resolveReminderBody(payload, mockT);
    expect(result).toBe("Review circular #CIRC-101 (Safety Protocol)");
  });

  it("returns default message for empty or default placeholder", () => {
    expect(resolveReminderBody(null, mockT)).toBe("Review pending circulars");
    expect(resolveReminderBody("circular_reminder", mockT)).toBe("Review pending circulars");
    expect(
      resolveReminderBody("يرجى مراجعة وتأكيد استلام التعاميم الإدارية المعلقة لقسمكم", mockT),
    ).toBe("Review pending circulars");
  });

  it("preserves custom user-typed messages", () => {
    const custom = "Please respond before end of day today!";
    expect(resolveReminderBody(custom, mockT)).toBe(custom);
  });
});
