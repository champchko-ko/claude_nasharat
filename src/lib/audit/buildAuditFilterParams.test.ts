import { describe, it, expect } from "vitest";
import { buildAuditFilterParams } from "./buildAuditFilterParams";

describe("buildAuditFilterParams", () => {
  it("builds empty params when filters are undefined", () => {
    const params = buildAuditFilterParams();
    expect(params.toString()).toBe("");
  });

  it("appends present filter fields", () => {
    const params = buildAuditFilterParams({
      action: "update",
      entityType: "profiles",
      startDate: "2026-10-01",
    });

    expect(params.get("action")).toBe("update");
    expect(params.get("entityType")).toBe("profiles");
    expect(params.get("startDate")).toBe("2026-10-01");
    expect(params.has("actorLabel")).toBe(false);
  });
});
