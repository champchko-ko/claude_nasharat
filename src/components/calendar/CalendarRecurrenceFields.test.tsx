import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarRecurrenceFields } from "./CalendarRecurrenceFields";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("CalendarRecurrenceFields", () => {
  it("renders frequency dropdown defaulting to none", () => {
    render(<CalendarRecurrenceFields />);
    const select = screen.getByLabelText("recurrenceFreq") as HTMLSelectElement;
    expect(select.value).toBe("none");
    expect(screen.queryByLabelText("recurrenceUntil")).toBeNull();
  });

  it("shows until and count fields when weekly is chosen", () => {
    render(<CalendarRecurrenceFields />);
    const select = screen.getByLabelText("recurrenceFreq");
    fireEvent.change(select, { target: { value: "weekly" } });

    expect(screen.getByLabelText("recurrenceUntil")).toBeInTheDocument();
    expect(screen.getByLabelText("recurrenceCount")).toBeInTheDocument();
  });
});
