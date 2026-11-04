import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicDocumentsSection } from "./PublicDocumentsSection";
import type { SchoolDocumentRow } from "@/lib/documents/types";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const messages: Record<string, string> = {
      documentsEyebrow: "مرفقات رسمية",
      documentsTitle: "أدلة ووثائق المدرسة",
      documentsSubtitle:
        "اضغط على أي دليل لعرضه — أو استخدم قائمة «أدلة وثائق المدرسة» في الأعلى من أي صفحة.",
      documentViewAction: "عرض الوثيقة",
      docOperationalPlanTitle: "الخطة التشغيلية",
      docOperationalPlanDesc: "أهداف الخطة السنوية ومؤشرات الأداء والتنفيذ.",
      docCommitteesGuideTitle: "دليل سير اللجان",
      docCommitteesGuideDesc: "تشكيل اللجان المدرسية ومهامها وآلية عملها.",
      docCounselingGuideTitle: "دليل الإرشاد المدرسي",
      docCounselingGuideDesc: "برامج الإرشاد الطلابي والخدمات النفسية والتربوية.",
      print: "طباعة",
      download: "تحميل",
      close: "إغلاق",
      noDocumentsPublic: "لم يتم رفع مستندات رسمية في هذا القسم حتى الآن.",
    };
    if (namespace === "documents") {
      return messages[key] || key;
    }
    return messages[key] || key;
  },
}));

describe("PublicDocumentsSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the eyebrow, title, and subtitle", () => {
    render(<PublicDocumentsSection />);

    expect(screen.getByText("مرفقات رسمية")).toBeDefined();
    expect(screen.getByText("أدلة ووثائق المدرسة")).toBeDefined();
    expect(
      screen.getByText(
        "اضغط على أي دليل لعرضه — أو استخدم قائمة «أدلة وثائق المدرسة» في الأعلى من أي صفحة."
      )
    ).toBeDefined();
  });

  it("renders all three document cards with PDF badges and view action buttons", () => {
    render(<PublicDocumentsSection />);

    expect(screen.getByText("الخطة التشغيلية")).toBeDefined();
    expect(screen.getByText("دليل سير اللجان")).toBeDefined();
    expect(screen.getByText("دليل الإرشاد المدرسي")).toBeDefined();

    const pdfBadges = screen.getAllByText("PDF");
    expect(pdfBadges).toHaveLength(3);

    const actionButtons = screen.getAllByText("عرض الوثيقة");
    expect(actionButtons).toHaveLength(3);
  });

  it("opens the preview dialog when an action button is clicked", () => {
    const mockDocs: SchoolDocumentRow[] = [
      {
        id: "d1",
        school_id: "s1",
        slug: "operational-plan",
        title: "الخطة التشغيلية 2026",
        description: "تفاصيل الخطة",
        file_path: "s1/plan.pdf",
        file_name: "plan.pdf",
        file_size: 1024,
        mime_type: "application/pdf",
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_url: "https://example.com/plan.pdf",
      },
    ];

    render(<PublicDocumentsSection documents={mockDocs} />);

    const actionButtons = screen.getAllByText("عرض الوثيقة");
    fireEvent.click(actionButtons[0]);

    expect(screen.getByText(/الخطة التشغيلية 2026/)).toBeDefined();
    expect(screen.getByText("طباعة")).toBeDefined();
    expect(screen.getByText("تحميل")).toBeDefined();
  });
});

