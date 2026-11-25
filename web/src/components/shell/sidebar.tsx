"use client";

import Link from "next/link";
import { CircleHelp, PanelLeft, Search, SquarePen } from "lucide-react";
import { LanaMark, LanaWordmark } from "@/components/lana/logo";
import { IconButton } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useActivity } from "@/lib/data/activity";
import { setUi, toggleSidebar, useSidebarCollapsed } from "@/lib/ui-state";
import { AccountButton, HelpMenu } from "./account-menu";
import { PRIMARY_NAV, SECONDARY_NAV, SETTINGS_NAV, isActive, type NavItem } from "./nav";
import { WithPathname } from "./with-pathname";

export function Sidebar() {
  return <WithPathname>{(pathname) => <SidebarFrame pathname={pathname ?? ""} />}</WithPathname>;
}

function SidebarFrame({ pathname }: { pathname: string }) {
  const collapsed = useSidebarCollapsed();
  const activity = useActivity();
  const pending = activity?.filter((a) => a.status === "awaiting_approval").length ?? 0;

  return (
    <aside
      aria-label="Sidebar"
      className="hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line-subtle bg-canvas transition-[width] duration-200 ease-(--ease-out) collapsed:w-[52px] md:flex"
    >
      {/* Brand + collapse */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-3 collapsed:justify-center collapsed:px-0">
        <Link href="/" aria-label="LANA home" className="flex min-w-0 items-center gap-2.5 rounded-md">
          <LanaMark size={22} />
          <LanaWordmark className="collapsed:hidden" />
        </Link>
        <Tooltip content="Collapse sidebar" shortcut={["["]} side="right">
          <IconButton label="Collapse sidebar" size="sm" onClick={toggleSidebar} className="ml-auto collapsed:hidden">
            <PanelLeft />
          </IconButton>
        </Tooltip>
      </div>

      {/* Search + new conversation */}
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <Tooltip content="Search" shortcut={["Ctrl", "K"]} side="right" disabled={!collapsed}>
          <button
            type="button"
            onClick={() => setUi({ paletteOpen: true })}
            aria-label="Search or jump to"
            className="flex h-8 items-center gap-2.5 rounded-md border border-line bg-panel px-2 text-sm text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted collapsed:justify-center collapsed:border-transparent collapsed:bg-transparent collapsed:px-0 collapsed:hover:bg-hover"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate text-left collapsed:hidden">Search</span>
            <Kbd className="collapsed:hidden">Ctrl K</Kbd>
          </button>
        </Tooltip>
        <NavLink
          item={{ href: "/assistant", label: "New conversation", icon: SquarePen, key: "n" }}
          active={false}
          collapsed={collapsed}
        />
      </div>

      <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pt-1">
        <ul className="flex flex-col gap-px">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 px-2 text-2xs font-medium text-fg-faint collapsed:sr-only">Workspace</p>
          <ul className="flex flex-col gap-px">
            {SECONDARY_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  active={isActive(pathname, item.href)}
                  collapsed={collapsed}
                  badge={item.href === "/activity" && pending > 0 ? pending : undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="flex shrink-0 flex-col gap-px border-t border-line-subtle px-2 py-2">
        <PreviewIndicator collapsed={collapsed} />
        <NavLink item={SETTINGS_NAV} active={isActive(pathname, SETTINGS_NAV.href)} collapsed={collapsed} />
        <HelpMenu
          trigger={
            <button
              type="button"
              aria-label="Help"
              className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg data-[state=open]:bg-hover collapsed:justify-center collapsed:px-0"
            >
              <CircleHelp className="size-4 shrink-0" />
              <span className="collapsed:hidden">Help</span>
            </button>
          }
        />
        <div className="mt-1">
          <AccountButton collapsed={collapsed} />
        </div>
        {collapsed && (
          <Tooltip content="Expand sidebar" shortcut={["["]} side="right">
            <IconButton label="Expand sidebar" size="md" onClick={toggleSidebar} className="mt-1 w-full">
              <PanelLeft />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Tooltip
      content={badge ? `${item.label} · ${badge} pending` : item.label}
      shortcut={item.key !== "n" ? ["G", item.key.toUpperCase()] : undefined}
      side="right"
      disabled={!collapsed}
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors collapsed:justify-center collapsed:px-0",
          active ? "bg-pressed font-medium text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-fg" : "text-fg-subtle")} strokeWidth={active ? 2.1 : 1.8} />
        <span className="flex-1 truncate collapsed:hidden">{item.label}</span>
        {badge !== undefined && (
          <>
            <span className="rounded bg-warning-soft px-1.5 text-2xs font-semibold tabular-nums leading-[18px] text-warning collapsed:hidden">
              {badge}
            </span>
            <span
              aria-hidden
              className="absolute right-2 top-1.5 hidden size-1.5 rounded-full bg-warning collapsed:block"
            />
          </>
        )}
      </Link>
    </Tooltip>
  );
}

function PreviewIndicator({ collapsed }: { collapsed: boolean }) {
  return (
    <Tooltip
      content="Preview build: sample data, simulated actions"
      side="right"
      disabled={!collapsed}
    >
      <div
        className="mb-1 flex h-8 items-center gap-2 rounded-md border border-dashed border-line-strong px-2 text-xs text-fg-subtle collapsed:justify-center collapsed:border-transparent collapsed:px-0"
        title={collapsed ? undefined : "No real services are contacted. Actions are simulated and labelled as such."}
      >
        <span className="size-1.5 shrink-0 rounded-full border border-dashed border-fg-subtle" aria-hidden />
        <span className="truncate collapsed:sr-only">Preview · sample data</span>
      </div>
    </Tooltip>
  );
}
