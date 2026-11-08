import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SchoolDocumentRowCard } from "./SchoolDocumentRowCard";

vi.mock("next-intl", () => ({ useLocale: () => "ar" }));

vi.mock("./SchoolDocumentRowActions", () => ({
  SchoolDocumentRowActions: () => <div />,
}));

describe("SchoolDocumentRowCard", () => {
  it("uses the application locale instead of the runtime default for document dates", () => {
    const createdAt = "2026-11-01T12:00:00.000Z";

    render(
      <SchoolDocumentRowCard
        document={{
          id: "document-1",
          slug: "operational-plan",
          title: "Operational plan",
          description: null,
          file_path: "documents/plan.pdf",
          file_name: "plan.pdf",
          file_size: 1_024,
          mime_type: "application/pdf",
          created_by: null,
          created_at: createdAt,
          updated_at: createdAt,
        }}
        onPreview={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(new Date(createdAt).toLocaleDateString("ar-EG"))).toBeInTheDocument();
  });
});
