import { describe, it, expect } from "vitest";
import { parseMaintenanceTransitionData } from "./parseMaintenanceTransitionData";
import { ValidationError } from "@/lib/errors/ValidationError";

describe("parseMaintenanceTransitionData", () => {
  it("parses valid transition data", () => {
    const formData = new FormData();
    formData.append("request_id", "req-123");
    formData.append("target_status", "in_progress");
    formData.append("reason", "Parts arrived");

    const parsed = parseMaintenanceTransitionData(formData);
    expect(parsed.requestId).toBe("req-123");
    expect(parsed.targetStatus).toBe("in_progress");
    expect(parsed.reason).toBe("Parts arrived");
  });

  it("throws ValidationError when request_id is missing", () => {
    const formData = new FormData();
    formData.append("target_status", "resolved");

    expect(() => parseMaintenanceTransitionData(formData)).toThrow(ValidationError);
  });

  it("throws ValidationError when target_status is invalid", () => {
    const formData = new FormData();
    formData.append("request_id", "req-123");
    formData.append("target_status", "non-existent-status");

    expect(() => parseMaintenanceTransitionData(formData)).toThrow(ValidationError);
  });
});
