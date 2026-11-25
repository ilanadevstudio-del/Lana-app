"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Brain, Link2, Lock, Mic, Palette, ShieldCheck, Sparkles, User, type LucideIcon } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/page";
import { WithPathname } from "@/components/shell/with-pathname";
import { cn } from "@/lib/cn";

export const SETTINGS_SECTIONS: { id: string; label: string; icon: LucideIcon; group: string }[] = [
  { id: "profile", label: "Profile", icon: User, group: "Account" },
  { id: "accounts", label: "Connected accounts", icon: Link2, group: "Account" },
  { id: "security", label: "Security", icon: Lock, group: "Account" },
  { id: "assistant", label: "Assistant", icon: Sparkles, group: "LANA" },
  { id: "voice", label: "Voice and language", icon: Mic, group: "LANA" },
  { id: "memory", label: "Memory", icon: Brain, group: "LANA" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Preferences" },
  { id: "privacy", label: "Privacy and data", icon: ShieldCheck, group: "Preferences" },
  { id: "appearance", label: "Appearance", icon: Palette, group: "Preferences" },
];

export function SettingsShell({ children }: { children: ReactNode }) {
  const groups = [...new Set(SETTINGS_SECTIONS.map((s) => s.group))];
  return (
    <Page>
      <PageHeader title="Settings" />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <WithPathname>
          {(pathname) => (
            <nav aria-label="Settings sections" className="shrink-0 border-b border-line-subtle md:w-60 md:overflow-y-auto md:border-b-0 md:border-r">
              <div className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:gap-4 md:px-2 md:py-4">
                {groups.map((g) => (
                  <div key={g} className="contents md:block">
                    <p className="hidden px-2.5 pb-1 text-2xs font-medium text-fg-faint md:block">{g}</p>
                    <ul className="contents md:flex md:flex-col md:gap-px">
                      {SETTINGS_SECTIONS.filter((s) => s.group === g).map((s) => {
                        const active = pathname === `/settings/${s.id}`;
                        const Icon = s.icon;
                        return (
                          <li key={s.id} className="shrink-0">
                            <Link
                              href={`/settings/${s.id}`}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex h-8 items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-sm transition-colors",
                                active ? "bg-pressed font-medium text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
                              )}
                            >
                              <Icon className={cn("size-4", active ? "text-fg" : "text-fg-subtle")} />
                              {s.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          )}
        </WithPathname>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[680px] px-4 pb-20 pt-6 md:px-8">{children}</div>
        </div>
      </div>
    </Page>
  );
}

/** Section heading + grouped rows. */
export function SettingsSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && <p className="mt-1 text-sm text-fg-subtle">{description}</p>}
      </header>
      {children}
    </div>
  );
}

export function SettingsGroup({ title, children, danger }: { title?: string; children: ReactNode; danger?: boolean }) {
  return (
    <section>
      {title && <h3 className={cn("mb-2 text-xs font-medium", danger ? "text-danger" : "text-fg-subtle")}>{title}</h3>}
      <div className={cn("divide-y divide-line-subtle rounded-lg border bg-panel px-4", danger ? "border-danger/30" : "border-line")}>{children}</div>
    </section>
  );
}
