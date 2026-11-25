"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CircleCheck, Home, Menu as MenuIcon, Monitor, Moon, Search, Sparkles, Sun } from "lucide-react";
import { LanaMark, LanaWordmark } from "@/components/lana/logo";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { useActivity } from "@/lib/data/activity";
import { useUser } from "@/lib/data/workspace";
import { setUi } from "@/lib/ui-state";
import { useThemePreference } from "@/lib/use-theme";
import { AccountMenu } from "./account-menu";
import { PRIMARY_NAV, SECONDARY_NAV, SETTINGS_NAV, isActive } from "./nav";
import { WithPathname } from "./with-pathname";

/** Mobile top bar: brand, current section, search and account. */
export function MobileTopBar() {
  const user = useUser();
  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line-subtle bg-canvas px-3 pt-[env(safe-area-inset-top)] md:hidden">
      <Link href="/" aria-label="LANA home">
        <LanaMark size={22} />
      </Link>
      <LanaWordmark className="text-sm" />
      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Search" onClick={() => setUi({ paletteOpen: true })}>
          <Search />
        </IconButton>
        <AccountMenu
          side="bottom"
          align="end"
          trigger={
            <button type="button" aria-label="Account menu" className="grid size-8 place-items-center rounded-md">
              {user ? <Avatar name={`${user.firstName} ${user.lastName}`} size={24} /> : null}
            </button>
          }
        />
      </div>
    </header>
  );
}

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CircleCheck },
  { href: "/assistant", label: "Ask", icon: Sparkles, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

/** Bottom tab bar. "Ask" sits in the middle so the assistant is always one tap away. */
export function MobileTabBar() {
  return <WithPathname>{(pathname) => <TabBar pathname={pathname ?? ""} />}</WithPathname>;
}

function TabBar({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activity = useActivity();
  const pending = activity?.filter((a) => a.status === "awaiting_approval").length ?? 0;
  const moreActive = [...SECONDARY_NAV, SETTINGS_NAV, PRIMARY_NAV[4]].some((n) => isActive(pathname, n.href));

  return (
    <>
      <nav
        aria-label="Primary"
        className="grid shrink-0 grid-cols-5 border-t border-line-subtle bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map(({ href, label, icon: Icon, primary }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex h-14 flex-col items-center justify-center gap-1 text-2xs font-medium"
            >
              {primary ? (
                <span
                  className={cn(
                    "grid h-7 w-11 place-items-center rounded-full transition-colors",
                    active ? "bg-accent text-on-accent" : "bg-accent-soft text-accent-text",
                  )}
                >
                  <Icon className="size-4" />
                </span>
              ) : (
                <Icon className={cn("size-5", active ? "text-fg" : "text-fg-subtle")} strokeWidth={active ? 2.1 : 1.8} />
              )}
              <span className={active ? "text-fg" : "text-fg-subtle"}>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex h-14 flex-col items-center justify-center gap-1 text-2xs font-medium"
        >
          <MenuIcon className={cn("size-5", moreActive ? "text-fg" : "text-fg-subtle")} />
          <span className={moreActive ? "text-fg" : "text-fg-subtle"}>More</span>
          {pending > 0 && <span aria-hidden className="absolute right-[calc(50%-14px)] top-2.5 size-1.5 rounded-full bg-warning" />}
        </button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} pending={pending} pathname={pathname} />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  pending,
  pathname,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: number;
  pathname: string;
}) {
  const [theme, setTheme] = useThemePreference();
  const items = [PRIMARY_NAV[4], ...SECONDARY_NAV, SETTINGS_NAV];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="More" side="bottom" showTitle={false}>
      <div className="p-3">
        <ul className="flex flex-col gap-px">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => onOpenChange(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-[15px]",
                    active ? "bg-pressed font-medium text-fg" : "text-fg-muted active:bg-hover",
                  )}
                >
                  <Icon className="size-[18px] text-fg-subtle" />
                  <span className="flex-1">{label}</span>
                  {href === "/activity" && pending > 0 && (
                    <span className="rounded bg-warning-soft px-1.5 text-xs font-semibold text-warning">
                      {pending} pending
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line-subtle px-3 pt-3">
          <span className="text-sm text-fg-muted">Theme</span>
          <div className="flex gap-1">
            {(
              [
                ["dark", Moon],
                ["light", Sun],
                ["system", Monitor],
              ] as const
            ).map(([value, Icon]) => (
              <IconButton
                key={value}
                label={`${value} theme`}
                variant={theme === value ? "secondary" : "ghost"}
                onClick={() => setTheme(value)}
              >
                <Icon />
              </IconButton>
            ))}
          </div>
        </div>
        <p className="mt-3 px-3 text-xs text-fg-faint">Preview build · sample data, simulated actions</p>
      </div>
    </Sheet>
  );
}
