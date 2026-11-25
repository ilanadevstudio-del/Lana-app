"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { WithPathname } from "@/components/shell/with-pathname";

/** Underline tabs where each tab is a route. Active state follows the pathname. */
export function LinkTabs({
  items,
  label,
  className,
}: {
  items: { href: string; label: string; count?: number; tone?: "warning" }[];
  label: string;
  className?: string;
}) {
  return (
    <WithPathname>
      {(pathname) => (
        <nav aria-label={label} className={cn("flex gap-4 overflow-x-auto", className)}>
          {items.map((i) => {
            const active = pathname === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors",
                  active ? "border-fg text-fg" : "border-transparent text-fg-subtle hover:text-fg",
                )}
              >
                {i.label}
                {i.count !== undefined && i.count > 0 && (
                  <span
                    className={cn(
                      "rounded px-1 text-2xs tabular-nums",
                      i.tone === "warning" ? "bg-warning-soft text-warning" : "bg-hover text-fg-muted",
                    )}
                  >
                    {i.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </WithPathname>
  );
}
