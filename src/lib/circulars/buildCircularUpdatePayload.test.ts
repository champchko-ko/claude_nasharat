import { describe, expect, it } from "vitest";
import { buildCircularUpdatePayload } from "./buildCircularUpdatePayload";

describe("buildCircularUpdatePayload", () => {
  it("builds circular update payload with optional visibility", () => {
    const payload = buildCircularUpdatePayload({
      title: "Title",
      body: "Body",
      priority: "normal",
      visibility: "public",
      status: "published",
      responseType: "acknowledgement",
      dueAt: "2026-11-01",
    });

    expect(payload.title).toBe("Title");
    expect(payload.visibility).toBe("public");
    expect(payload.status).toBe("published");
  });

  it("omits visibility when not provided", () => {
    const payload = buildCircularUpdatePayload({
      title: "Title",
      body: "Body",
      priority: "normal",
      responseType: "acknowledgement",
      dueAt: null,
    });

    expect(payload.title).toBe("Title");
    expect(payload.visibility).toBeUndefined();
  });
});
