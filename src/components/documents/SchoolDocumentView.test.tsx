import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolDocumentView } from "./SchoolDocumentView";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SchoolDocumentView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the document title, description, and preparation badge", () => {
    render(
      <SchoolDocumentView
        slug="operational-plan"
        title="الخطة التشغيلية"
        description="أهداف الخطة السنوية ومؤشرات الأداء والتنفيذ."
      />,
    );

    expect(screen.getAllByText("الخطة التشغيلية")).toHaveLength(2);
    expect(screen.getAllByText("أهداف الخطة السنوية ومؤشرات الأداء والتنفيذ.")).toHaveLength(2);
    expect(screen.getByText("قيد التجهيز والإعداد")).toBeDefined();
    expect(screen.getByText("العودة للوحة التحكم")).toBeDefined();
  });
});
