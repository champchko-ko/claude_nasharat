import React from "react";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditCalendarEventForm } from "./EditCalendarEventForm";
import type { CalendarEventRow } from "@/lib/calendar/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const mockUpdateAction = vi.fn();
vi.mock("@/actions/calendar/updateCalendarEventAction", () => ({
  updateCalendarEventAction: (formData: FormData) => mockUpdateAction(formData),
}));

describe("EditCalendarEventForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockEvent: CalendarEventRow = {
    id: "evt-123",
    title_ar: "حفل التخرج السنوي",
    title_en: "Annual Graduation Ceremony",
    description: "Honoring outstanding students",
    category: "activity",
    starts_at: "2026-11-15T09:00:00Z",
    ends_at: "2026-11-15T12:00:00Z",
    all_day: false,
    visibility: "public",
    status: "published",
    location: "Main Auditorium",
    image_path: null,
    created_by: "usr-1",
    published_at: "2026-10-01T08:00:00Z",
    cancelled_at: null,
    created_at: "2026-10-01T08:00:00Z",
    updated_at: "2026-10-01T08:00:00Z",
  };

  it("pre-populates the input fields with existing event details", () => {
    render(<EditCalendarEventForm event={mockEvent} />);

    const titleArInput = screen.getByDisplayValue("حفل التخرج السنوي");
    expect(titleArInput).toBeDefined();

    const titleEnInput = screen.getByDisplayValue("Annual Graduation Ceremony");
    expect(titleEnInput).toBeDefined();

    const locationInput = screen.getByDisplayValue("Main Auditorium");
    expect(locationInput).toBeDefined();

    const descInput = screen.getByDisplayValue("Honoring outstanding students");
    expect(descInput).toBeDefined();

    const hiddenId = document.querySelector('input[name="event_id"]') as HTMLInputElement;
    expect(hiddenId?.value).toBe("evt-123");
  });

  it("calls updateCalendarEventAction on submit and redirects on success", async () => {
    mockUpdateAction.mockResolvedValueOnce({ success: true });

    render(<EditCalendarEventForm event={mockEvent} />);

    const submitBtn = screen.getByRole("button", { name: "save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/en/calendar/evt-123");
    });
  });
});
