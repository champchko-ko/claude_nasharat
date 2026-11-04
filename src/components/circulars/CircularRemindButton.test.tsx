import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircularRemindButton } from "./CircularRemindButton";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      urgePending: "Urge Pending",
      remindModalTitle: "Send Circular Reminder",
      cancel: "Cancel",
      draft: "Cancel",
    };
    return map[key] ?? key;
  },
  useLocale: () => "en",
}));

vi.mock("./CircularRemindModal", () => ({
  CircularRemindModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="remind-modal">
        <span>Send Circular Reminder</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

describe("CircularRemindButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders urge pending button and opens modal when clicked", () => {
    render(<CircularRemindButton circularId="c-123" circularTitle="Test Circular" />);

    const button = screen.getByText("Urge Pending");
    expect(button).toBeDefined();

    expect(screen.queryByTestId("remind-modal")).toBeNull();

    fireEvent.click(button);

    expect(screen.getByTestId("remind-modal")).toBeDefined();
    expect(screen.getByText("Send Circular Reminder")).toBeDefined();
  });
});
