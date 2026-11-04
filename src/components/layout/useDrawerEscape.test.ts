import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDrawerEscape } from "./useDrawerEscape";

describe("useDrawerEscape", () => {
  beforeEach(() => {
    document.body.style.overflow = "visible";
  });

  it("locks overflow and calls onClose on Escape keydown", () => {
    const onClose = vi.fn();
    renderHook(() => useDrawerEscape(onClose, true));

    expect(document.body.style.overflow).toBe("hidden");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onClose).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not lock overflow or attach listener when disabled", () => {
    const onClose = vi.fn();
    renderHook(() => useDrawerEscape(onClose, false));

    expect(document.body.style.overflow).toBe("visible");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("restores original body overflow on unmount", () => {
    document.body.style.overflow = "scroll";
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useDrawerEscape(onClose, true));

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
