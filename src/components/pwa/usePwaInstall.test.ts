import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePwaInstall } from "./usePwaInstall";

describe("usePwaInstall", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("handles dismissal correctly", () => {
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isInstallable).toBe(false);
  });

  it("toggles iOS guide modal state", () => {
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isIosGuideOpen).toBe(false);

    act(() => {
      result.current.openIosGuide();
    });
    expect(result.current.isIosGuideOpen).toBe(true);

    act(() => {
      result.current.closeIosGuide();
    });
    expect(result.current.isIosGuideOpen).toBe(false);
  });

  it("opens iOS guide when promptInstall is called on iOS device", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isIos).toBe(true);

    act(() => {
      result.current.promptInstall();
    });

    expect(result.current.isIosGuideOpen).toBe(true);
  });
});
