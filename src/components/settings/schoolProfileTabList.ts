import {
  Building2Icon,
  UsersIcon,
  MapPinIcon,
  ImageIcon,
  CalendarDaysIcon,
  CompassIcon,
} from "lucide-react";
import type { SchoolProfileTabItem } from "./schoolProfileTabTypes";

export const SCHOOL_PROFILE_TABS: readonly SchoolProfileTabItem[] = [
  {
    id: "identity",
    labelKey: "identity",
    icon: Building2Icon,
  },
  {
    id: "leadership",
    labelKey: "leadership",
    icon: UsersIcon,
  },
  {
    id: "contact",
    labelKey: "contactAndLocation",
    icon: MapPinIcon,
  },
  {
    id: "logo",
    labelKey: "logo",
    icon: ImageIcon,
  },
  {
    id: "operations",
    labelKey: "operationalSettings",
    icon: CalendarDaysIcon,
  },
  {
    id: "narrative",
    labelKey: "visionAndMission",
    icon: CompassIcon,
  },
];
