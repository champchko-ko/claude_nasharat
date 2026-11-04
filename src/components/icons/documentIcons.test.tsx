import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OperationalPlanIcon } from "./OperationalPlanIcon";
import { CommitteesGuideIcon } from "./CommitteesGuideIcon";
import { CounselingGuideIcon } from "./CounselingGuideIcon";

describe("Document Icons", () => {
  it("renders OperationalPlanIcon with svg element", () => {
    const { container } = render(<OperationalPlanIcon className="size-6 text-gold" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-6");
    expect(svg).toHaveClass("text-gold");
  });

  it("renders CommitteesGuideIcon with svg element", () => {
    const { container } = render(<CommitteesGuideIcon className="size-6 text-gold" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-6");
  });

  it("renders CounselingGuideIcon with svg element", () => {
    const { container } = render(<CounselingGuideIcon className="size-6 text-gold" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("size-6");
  });
});
