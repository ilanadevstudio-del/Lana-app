"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronsUpDown, Keyboard, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { useUser } from "@/lib/data/workspace";
import type { ThemePreference } from "@/lib/theme";
import { useThemePreference } from "@/lib/use-theme";
import { setUi } from "@/lib/ui-state";

export function AccountMenu({ trigger, side = "top", align = "start" }: { trigger: ReactNode; side?: "top" | "bottom"; align?: "start" | "end" }) {
  const user = useUser();
  const [theme, setTheme] = useThemePreference();
  const router = useRouter();
  const name = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <Menu>
      <MenuTrigger asChild>{trigger}</MenuTrigger>
      <MenuContent side={side} align={align} className="w-60">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar name={name || "?"} size={28} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem icon={<User />} onSelect={() => router.push("/settings/profile")}>
          Profile
        </MenuItem>
        <MenuItem icon={<Keyboard />} shortcut="?" onSelect={() => setUi({ shortcutsOpen: true })}>
          Keyboard shortcuts
        </MenuItem>
        <MenuSeparator />
        <MenuLabel>Theme</MenuLabel>
        <MenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemePreference)}>
          <MenuRadioItem value="dark" icon={<Moon />}>
            Dark
          </MenuRadioItem>
          <MenuRadioItem value="light" icon={<Sun />}>
            Light
          </MenuRadioItem>
          <MenuRadioItem value="system" icon={<Monitor />}>
            System
          </MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem icon={<LogOut />} disabled trailing={<span className="text-2xs text-fg-faint">No auth in preview</span>}>
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/** The button at the bottom of the sidebar that opens the account menu. */
export function AccountButton({ collapsed }: { collapsed: boolean }) {
  const user = useUser();
  const name = user ? `${user.firstName} ${user.lastName}` : "";
  return (
    <AccountMenu
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-md px-1.5 text-left transition-colors hover:bg-hover data-[state=open]:bg-hover",
          )}
        >
          {user ? <Avatar name={name} size={24} /> : <span className="size-6 rounded-full bg-hover" />}
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 collapsed:hidden">
                <span className="block truncate text-sm font-medium text-fg">{name}</span>
              </span>
              <ChevronsUpDown className="size-3.5 text-fg-faint collapsed:hidden" />
            </>
          )}
        </button>
      }
    />
  );
}

export function HelpMenu({ trigger }: { trigger: ReactNode }) {
  return (
    <Menu>
      <MenuTrigger asChild>{trigger}</MenuTrigger>
      <MenuContent side="right" align="end" className="w-56">
        <MenuItem icon={<Keyboard />} shortcut="?" onSelect={() => setUi({ shortcutsOpen: true })}>
          Keyboard shortcuts
        </MenuItem>
        <MenuItem icon={<BookOpen />} disabled trailing={<span className="text-2xs text-fg-faint">Soon</span>}>
          Documentation
        </MenuItem>
        <MenuSeparator />
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-fg-subtle">
          <Check className="size-3.5" /> Preview build · sample data
        </div>
      </MenuContent>
    </Menu>
  );
}
