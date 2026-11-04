export interface StatItem {
  id: "circulars" | "maintenance" | "events" | "achievements";
  label: string;
  value: number;
  icon: string;
  left: number;
  labelRight: number;
  numberX: number;
  iconX: number;
  iconY: number;
  labelColor: string;
  numberColor: string;
}

export function getNewDashboardStatDefs(counts: {
  circulars: number;
  maintenance: number;
  events: number;
  achievements: number;
}): StatItem[] {
  return [
    {
      id: "circulars",
      label: "المناشير والتعميمات",
      value: counts.circulars,
      icon: "/assets/dashboard/stat_bell.png",
      left: 495,
      labelRight: 574,
      numberX: 554,
      iconX: 588,
      iconY: 245,
      labelColor: "#b64b28",
      numberColor: "#b8350e",
    },
    {
      id: "maintenance",
      label: "طلبات الصيانة",
      value: counts.maintenance,
      icon: "/assets/dashboard/stat_wrench.png",
      left: 360,
      labelRight: 408,
      numberX: 398,
      iconX: 431,
      iconY: 245,
      labelColor: "#287d72",
      numberColor: "#0a4558",
    },
    {
      id: "events",
      label: "الفعاليات المجدولة",
      value: counts.events,
      icon: "/assets/dashboard/stat_clip.png",
      left: 230,
      labelRight: 280,
      numberX: 266,
      iconX: 298,
      iconY: 245,
      labelColor: "#7a4da6",
      numberColor: "#6e31a4",
    },
    {
      id: "achievements",
      label: "الإنجازات المعتمدة",
      value: counts.achievements,
      icon: "/assets/dashboard/stat_file.png",
      left: 82,
      labelRight: 131,
      numberX: 118,
      iconX: 158,
      iconY: 246,
      labelColor: "#213fab",
      numberColor: "#0e2a94",
    },
  ];
}
