import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditUserSubmit } from "./useEditUserSubmit";
import { updateUserAction } from "@/actions/settings/updateUserAction";

const mockRefresh = vi.fn();

vi.mock("@/i18n", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/actions/settings/updateUserAction", () => ({
  updateUserAction: vi.fn(),
}));

describe("useEditUserSubmit", () => {
  it("calls onClose and router.refresh on success", async () => {
    vi.mocked(updateUserAction).mockResolvedValueOnce({ success: true });
    const onClose = vi.fn();

    const { result } = renderHook(() => useEditUserSubmit(onClose));

    await act(async () => {
      result.current.submit({
        userId: "user-1",
        fullName: "New Name",
      });
    });

    expect(onClose).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
