import { describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { revalidateSettingsPath } from "./revalidateSettingsPath";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("revalidateSettingsPath", () => {
  it("revalidates subpath for both locales, page and layout", () => {
    vi.clearAllMocks();
    revalidateSettingsPath("school");

    expect(revalidatePath).toHaveBeenCalledWith("/settings/school");
    expect(revalidatePath).toHaveBeenCalledWith("/en/settings/school");
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(app)/settings/school", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(app)/settings", "layout");
  });

  it("revalidates root settings when no subpath is passed", () => {
    vi.clearAllMocks();
    revalidateSettingsPath();

    expect(revalidatePath).toHaveBeenCalledWith("/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/en/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(app)/settings", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(app)/settings", "layout");
  });
});
