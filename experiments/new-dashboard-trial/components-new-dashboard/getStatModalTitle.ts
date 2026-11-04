export function getStatModalTitle(id: string): string {
  const titles: Record<string, string> = {
    circulars: "المناشير والتعميمات",
    maintenance: "طلبات الصيانة",
    events: "الفعاليات المجدولة",
    achievements: "الإنجازات المعتمدة",
  };
  return titles[id] ?? "التفاصيل";
}
