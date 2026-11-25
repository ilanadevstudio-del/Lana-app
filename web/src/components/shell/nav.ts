import {
  Activity,
  Brain,
  CalendarDays,
  CircleCheck,
  FolderKanban,
  Home,
  MessageSquare,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key of the "G then …" shortcut. */
  key: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, key: "h" },
  { href: "/assistant", label: "Assistant", icon: MessageSquare, key: "a" },
  { href: "/tasks", label: "Tasks", icon: CircleCheck, key: "t" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, key: "c" },
  { href: "/projects", label: "Projects", icon: FolderKanban, key: "p" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/integrations", label: "Integrations", icon: Plug, key: "i" },
  { href: "/activity", label: "Activity", icon: Activity, key: "y" },
  { href: "/memory", label: "Memory", icon: Brain, key: "m" },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "Settings", icon: Settings, key: "s" };

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV, SETTINGS_NAV];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
