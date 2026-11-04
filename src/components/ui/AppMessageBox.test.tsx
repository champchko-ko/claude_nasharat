import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppMessageBox } from "./AppMessageBox";
import { showMessageBox } from "@/lib/feedback/showMessageBox";
import { closeMessageBox } from "@/lib/feedback/closeMessageBox";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      confirm: "OK",
      cancel: "Cancel",
      notice: "Notice",
      success: "Success",
      error: "Error",
      warning: "Warning",
    };
    return map[key] ?? key;
  },
  useLocale: () => "en",
}));

describe("AppMessageBox", () => {
  afterEach(() => {
    act(() => {
      closeMessageBox();
    });
    cleanup();
  });

  it("renders nothing when closed", () => {
    render(<AppMessageBox />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders modal with message and dismisses on click", () => {
    render(<AppMessageBox />);

    act(() => {
      showMessageBox({
        title: "Test Alert",
        message: "This is a centered message box",
        type: "info",
      });
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Test Alert")).toBeDefined();
    expect(screen.getByText("This is a centered message box")).toBeDefined();

    const okBtn = screen.getByRole("button", { name: "OK" });
    fireEvent.click(okBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders cancel button and triggers onCancel when cancelled", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<AppMessageBox />);

    act(() => {
      showMessageBox({
        title: "Confirm Action",
        message: "Are you sure you want to proceed?",
        type: "warning",
        showCancel: true,
        onConfirm,
        onCancel,
      });
    });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    expect(screen.getByRole("button", { name: "OK" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
