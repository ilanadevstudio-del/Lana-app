"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Avatar } from "@/components/avatar";
import { Orb } from "@/components/orb";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-4 md:flex">
      <div className="glass flex w-full flex-col rounded-[32px] p-3">
        <Link href="/" className="flex items-center gap-3 px-3 pb-2 pt-3">
          <Orb size={30} />
          <span className="text-2xl font-bold tracking-tight">Lana</span>
        </Link>

        <nav aria-label="Primary" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Glyph }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="glass-strong absolute inset-0 rounded-2xl"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Glyph
                  size={21}
                  weight={active ? "duotone" : "regular"}
                  className={`relative transition-transform duration-300 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:-rotate-6 group-hover:scale-110 ${
                    active ? "text-accent" : ""
                  }`}
                />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-2xl p-2">
          <Avatar name={userName} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted">Personal</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
