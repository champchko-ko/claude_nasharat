import { describe, expect, it } from "vitest";
import { resolveComplianceTone } from "./resolveComplianceTone";

describe("resolveComplianceTone", () => {
  it("returns success tone for percentages at or above 80%", () => {
    const tone80 = resolveComplianceTone(80);
    expect(tone80.fillClass).toBe("bg-success");
    expect(tone80.strokeClass).toBe("stroke-success");
    expect(tone80.textClass).toBe("text-success");

    const tone100 = resolveComplianceTone(100);
    expect(tone100.strokeClass).toBe("stroke-success");
  });

  it("returns warning tone for percentages between 50% and 79%", () => {
    const tone50 = resolveComplianceTone(50);
    expect(tone50.fillClass).toBe("bg-warning");
    expect(tone50.strokeClass).toBe("stroke-warning");
    expect(tone50.textClass).toBe("text-warning");

    const tone79 = resolveComplianceTone(79);
    expect(tone79.strokeClass).toBe("stroke-warning");
  });

  it("returns destructive tone for percentages below 50%", () => {
    const tone49 = resolveComplianceTone(49);
    expect(tone49.fillClass).toBe("bg-destructive");
    expect(tone49.strokeClass).toBe("stroke-destructive");
    expect(tone49.textClass).toBe("text-destructive");

    const tone0 = resolveComplianceTone(0);
    expect(tone0.strokeClass).toBe("stroke-destructive");
  });
});
