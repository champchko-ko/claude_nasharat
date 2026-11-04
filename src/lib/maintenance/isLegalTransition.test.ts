import { describe, expect, it } from "vitest";
import { isLegalTransition } from "./isLegalTransition";

describe("isLegalTransition", () => {
  it("allows same-status transitions as no-op", () => {
    expect(isLegalTransition("submitted", "submitted")).toBe(true);
    expect(isLegalTransition("in_progress", "in_progress")).toBe(true);
  });

  it("permits legal forward transitions", () => {
    expect(isLegalTransition("submitted", "triaged")).toBe(true);
    expect(isLegalTransition("submitted", "assigned")).toBe(true);
    expect(isLegalTransition("submitted", "rejected")).toBe(true);
    expect(isLegalTransition("triaged", "assigned")).toBe(true);
    expect(isLegalTransition("assigned", "in_progress")).toBe(true);
    expect(isLegalTransition("assigned", "waiting_for_parts")).toBe(true);
    expect(isLegalTransition("in_progress", "waiting_for_parts")).toBe(true);
    expect(isLegalTransition("in_progress", "resolved")).toBe(true);
    expect(isLegalTransition("waiting_for_parts", "in_progress")).toBe(true);
    expect(isLegalTransition("resolved", "closed")).toBe(true);
    expect(isLegalTransition("resolved", "reopened")).toBe(true);
    expect(isLegalTransition("closed", "reopened")).toBe(true);
    expect(isLegalTransition("reopened", "assigned")).toBe(true);
    expect(isLegalTransition("reopened", "in_progress")).toBe(true);
  });

  it("blocks illegal transitions", () => {
    expect(isLegalTransition("submitted", "closed")).toBe(false);
    expect(isLegalTransition("submitted", "resolved")).toBe(false);
    expect(isLegalTransition("triaged", "in_progress")).toBe(false);
    expect(isLegalTransition("rejected", "in_progress")).toBe(false);
    expect(isLegalTransition("rejected", "closed")).toBe(false);
    expect(isLegalTransition("closed", "resolved")).toBe(false);
  });
});
