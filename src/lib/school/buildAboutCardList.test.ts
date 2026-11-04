import { describe, it, expect } from "vitest";
import { buildAboutCardList } from "./buildAboutCardList";
import type { PublicSchoolProfileRow } from "./getPublicSchoolProfile";

describe("buildAboutCardList", () => {
  const mockSchool: PublicSchoolProfileRow = {
    id: "s-1",
    name_ar: "مدرسة الأمل",
    name_en: "Al-Amal School",
    slug: "al-amal",
    logo_path: null,
    timezone: "Asia/Kuwait",
    manager_name_ar: "سلوى العنزي",
    manager_name_en: "Salwa Al-Enezi",
    assistant_manager_ar: "منى المطيري",
    assistant_manager_en: "Mona Al-Mutairi",
    assistant_manager_2_ar: "خزنه الشمري",
    assistant_manager_2_en: "Khazna Al-Shammari",
    vision_ar: "رؤية المدرسة",
    vision_en: "School vision",
    mission_ar: "رسالة المدرسة",
    mission_en: "School mission",
    objectives: "إنجازات متميزة",
    public_description: "وصف",
    vision: null,
    mission: null,
  };

  const mockT = (key: string) => {
    const map: Record<string, string> = {
      vision: "Our Vision",
      mission: "Our Mission",
      achievements: "Achievements",
      managerTitle: "Principal",
      assistantManager1Title: "Assistant Principal 1",
      assistantManager2Title: "Assistant Principal 2",
    };
    return map[key] ?? key;
  };

  const mockTSettings = (key: string) => {
    if (key === "leadership") return "School Leadership";
    return key;
  };

  it("returns an empty array for null school", () => {
    expect(buildAboutCardList(null, "ar", mockT, mockTSettings)).toEqual([]);
  });

  it("builds all cards including full leadership with titles in Arabic", () => {
    const cards = buildAboutCardList(mockSchool, "ar", mockT, mockTSettings);
    expect(cards).toHaveLength(4);

    const leadershipCard = cards.find((c) => c.key === "leadership");
    expect(leadershipCard).toBeDefined();
    expect(leadershipCard?.title).toBe("School Leadership");
    expect(leadershipCard?.content).toContain("Principal: سلوى العنزي");
    expect(leadershipCard?.content).toContain("Assistant Principal 1: منى المطيري");
    expect(leadershipCard?.content).toContain("Assistant Principal 2: خزنه الشمري");
  });

  it("builds leadership card in English", () => {
    const cards = buildAboutCardList(mockSchool, "en", mockT, mockTSettings);
    const leadershipCard = cards.find((c) => c.key === "leadership");
    expect(leadershipCard?.content).toContain("Principal: Salwa Al-Enezi");
    expect(leadershipCard?.content).toContain("Assistant Principal 1: Mona Al-Mutairi");
    expect(leadershipCard?.content).toContain("Assistant Principal 2: Khazna Al-Shammari");
  });
});
