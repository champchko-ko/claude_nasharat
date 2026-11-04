import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CircularApprovalResponse } from "./CircularApprovalResponse";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      rejectionReason: "سبب الرفض (إلزامي في حالة الرفض)",
      reasonPlaceholder: "يرجى توضيح سبب الرفض...",
      ackAction: "تم الاطلاع",
      respondedAction: "تم الرد",
      rejectAction: "الرفض",
      acknowledged: "تم الاطلاع",
    };
    return translations[key] ?? key;
  },
}));

describe("CircularApprovalResponse", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders all three response options: Acknowledge (تم الاطلاع), Responded (تم الرد), and Reject (الرفض)", () => {
    const onAcknowledge = vi.fn();
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <CircularApprovalResponse
        reason=""
        onReasonChange={vi.fn()}
        onAcknowledge={onAcknowledge}
        onApprove={onApprove}
        onReject={onReject}
        isPending={false}
      />,
    );

    expect(screen.getByRole("button", { name: /تم الاطلاع/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تم الرد/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الرفض/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/سبب الرفض/i)).toBeInTheDocument();
  });

  it("calls onAcknowledge when 'تم الاطلاع' is clicked", () => {
    const onAcknowledge = vi.fn();

    render(
      <CircularApprovalResponse
        reason=""
        onReasonChange={vi.fn()}
        onAcknowledge={onAcknowledge}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /تم الاطلاع/i }));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it("calls onApprove when 'تم الرد' is clicked", () => {
    const onApprove = vi.fn();

    render(
      <CircularApprovalResponse
        reason=""
        onReasonChange={vi.fn()}
        onAcknowledge={vi.fn()}
        onApprove={onApprove}
        onReject={vi.fn()}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /تم الرد/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("calls onReject when 'الرفض' is clicked", () => {
    const onReject = vi.fn();

    render(
      <CircularApprovalResponse
        reason="Not within department remit"
        onReasonChange={vi.fn()}
        onAcknowledge={vi.fn()}
        onApprove={vi.fn()}
        onReject={onReject}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /الرفض/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("displays acknowledged badge and leaves Responded & Reject buttons active when isAcknowledged is true", () => {
    render(
      <CircularApprovalResponse
        reason=""
        onReasonChange={vi.fn()}
        onAcknowledge={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        isPending={false}
        isAcknowledged={true}
      />,
    );

    // The 'تم الاطلاع' action button is replaced by the status badge
    expect(screen.queryByRole("button", { name: /تم الاطلاع/i })).not.toBeInTheDocument();
    expect(screen.getByText("تم الاطلاع")).toBeInTheDocument();

    // The department can still submit 'تم الرد' or 'الرفض'
    expect(screen.getByRole("button", { name: /تم الرد/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الرفض/i })).toBeInTheDocument();
  });
});
