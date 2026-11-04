import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendClientErrorReport } = vi.hoisted(() => ({
  mockSendClientErrorReport: vi.fn(),
}));

vi.mock("./sendClientErrorReport", () => ({
  sendClientErrorReport: mockSendClientErrorReport,
}));

import { reportClientError } from "./reportClientError";

describe("reportClientError", () => {
  beforeEach(() => {
    mockSendClientErrorReport.mockClear();
  });

  it("reports the failure without creating a second browser console error", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const correlationId = reportClientError(new Error("dashboard failed"), "error");

    expect(correlationId).toMatch(/^cli_/);
    expect(mockSendClientErrorReport).toHaveBeenCalledWith(
      expect.objectContaining({ message: "dashboard failed", source: "error" }),
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
