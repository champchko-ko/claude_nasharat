import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CircularResponseBox } from "./CircularResponseBox";
import type { CircularResponseRow } from "@/lib/circulars/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      respond: "تسجيل الاستجابة",
      responseStatus: "حالة الاستجابة",
      ackAction: "تم الاطلاع",
      respondedAction: "تم الرد",
      rejectAction: "الرفض",
      rejectionReason: "سبب الرفض (إلزامي في حالة الرفض)",
      reasonPlaceholder: "يرجى توضيح سبب الرفض...",
      acknowledged: "تم الاطلاع",
      approved: "تم الرد",
      rejected: "الرفض",
      completed: "مكتمل",
    };
    return translations[key] ?? key;
  },
}));

vi.mock("@/actions/circulars/submitCircularResponseAction", () => ({
  submitCircularResponseAction: vi.fn(),
}));

describe("CircularResponseBox", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 3 response options when department has not responded yet", () => {
    render(
      <CircularResponseBox circularId="circ-1" responseType="approval" existingResponse={null} />,
    );

    expect(screen.getByRole("button", { name: /تم الاطلاع/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تم الرد/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الرفض/i })).toBeInTheDocument();
  });

  it("allows responding with 'تم الرد' or 'الرفض' after department has previously acknowledged ('تم الاطلاع')", () => {
    const acknowledgedResponse: CircularResponseRow = {
      id: "resp-1",
      circular_id: "circ-1",
      department_id: "dept-1",
      responder_id: "user-1",
      response_type: "approval",
      status: "acknowledged",
      reason: null,
      is_latest: true,
      submitted_at: new Date().toISOString(),
    };

    render(
      <CircularResponseBox
        circularId="circ-1"
        responseType="approval"
        existingResponse={acknowledgedResponse}
      />,
    );

    // Banner indicates existing status is 'تم الاطلاع'
    expect(screen.getByText(/حالة الاستجابة: تم الاطلاع/i)).toBeInTheDocument();

    // Department can still submit 'تم الرد' or 'الرفض'
    expect(screen.getByRole("button", { name: /تم الرد/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الرفض/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /تم الاطلاع/i })).not.toBeInTheDocument();
  });

  it("hides action buttons once a final response ('approved' or 'rejected') has been recorded", () => {
    const approvedResponse: CircularResponseRow = {
      id: "resp-2",
      circular_id: "circ-1",
      department_id: "dept-1",
      responder_id: "user-1",
      response_type: "approval",
      status: "approved",
      reason: null,
      is_latest: true,
      submitted_at: new Date().toISOString(),
    };

    render(
      <CircularResponseBox
        circularId="circ-1"
        responseType="approval"
        existingResponse={approvedResponse}
      />,
    );

    expect(screen.getByText(/حالة الاستجابة: تم الرد/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /تم الاطلاع/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /تم الرد/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /الرفض/i })).not.toBeInTheDocument();
  });
});
