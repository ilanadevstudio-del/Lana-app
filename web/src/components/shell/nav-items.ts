import {
  BrainIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  HouseIcon,
  PlugsConnectedIcon,
  SparkleIcon,
  type Icon,
} from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

/** Primary navigation — PRD §6.1. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/assistant", label: "Assistant", icon: SparkleIcon },
  { href: "/tasks", label: "Tasks", icon: CheckCircleIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarBlankIcon },
  { href: "/integrations", label: "Integrations", icon: PlugsConnectedIcon },
  { href: "/memory", label: "Memory", icon: BrainIcon },
  { href: "/activity", label: "Activity", icon: ClockCounterClockwiseIcon },
  { href: "/settings", label: "Settings", icon: GearSixIcon },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
