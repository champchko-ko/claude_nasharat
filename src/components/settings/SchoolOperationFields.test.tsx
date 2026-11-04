import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { SchoolOperationFields } from "./SchoolOperationFields";

afterEach(() => {
  cleanup();
});

const messages = {
  settings: {
    operationalSettings: "الإعدادات التشغيلية والتقويم المدرسي",
    workingDays: "أيام العمل الأسبوعية",
    workingDaysHint: "الأيام المعتمدة للدوام الرسمي ومواعيد استجابة التعاميم والصيانة",
    dateFormat: "صيغة عرض التاريخ",
    daySunday: "الأحد",
    dayMonday: "الإثنين",
    dayTuesday: "الثلاثاء",
    dayWednesday: "الأربعاء",
    dayThursday: "الخميس",
    dayFriday: "الجمعة",
    daySaturday: "السبت",
    dateFormatIso: "YYYY-MM-DD (القياسي الدولي)",
    dateFormatSlash: "DD/MM/YYYY (يوم/شهر/سنة)",
    dateFormatUs: "MM/DD/YYYY (شهر/يوم/سنة)",
  },
};

describe("SchoolOperationFields", () => {
  it("renders all 7 days of the week with default checked days", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={messages}>
        <SchoolOperationFields
          workingDays={[0, 1, 2, 3, 4]}
          dateFormat="yyyy-MM-dd"
          canManage={true}
        />
      </NextIntlClientProvider>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(7);

    // Sunday (0) to Thursday (4) should be checked
    expect(checkboxes[0]).toBeChecked(); // Sunday
    expect(checkboxes[1]).toBeChecked(); // Monday
    expect(checkboxes[2]).toBeChecked(); // Tuesday
    expect(checkboxes[3]).toBeChecked(); // Wednesday
    expect(checkboxes[4]).toBeChecked(); // Thursday
    expect(checkboxes[5]).not.toBeChecked(); // Friday
    expect(checkboxes[6]).not.toBeChecked(); // Saturday
  });

  it("disables inputs when canManage is false", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={messages}>
        <SchoolOperationFields
          workingDays={[0, 1, 2, 3, 4]}
          dateFormat="dd/MM/yyyy"
          canManage={false}
        />
      </NextIntlClientProvider>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => {
      expect(cb).toBeDisabled();
    });

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
    expect(select).toHaveValue("dd/MM/yyyy");
  });
});
