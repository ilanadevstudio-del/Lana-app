"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/ui-state";

/**
 * Page scaffolding shared by every section:
 *   <Page>
 *     <PageHeader title actions />
 *     <PageToolbar>filters / tabs</PageToolbar>
 *     <SplitView aside={…}> scrolling content </SplitView>
 *   </Page>
 */

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full min-h-0 flex-col", className)}>{children}</div>;
}

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  crumbs,
  actions,
  icon,
  meta,
}: {
  title: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line-subtle px-4 md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {crumbs?.map((c) => (
          <Fragment key={c.label}>
            {c.href ? (
              <Link href={c.href} className="hidden shrink-0 text-sm text-fg-subtle transition-colors hover:text-fg sm:inline">
                {c.label}
              </Link>
            ) : (
              <span className="hidden shrink-0 text-sm text-fg-subtle sm:inline">{c.label}</span>
            )}
            <ChevronRight className="hidden size-3.5 shrink-0 text-fg-faint sm:block" />
          </Fragment>
        ))}
        {icon && <span className="shrink-0 text-fg-subtle [&_svg]:size-4">{icon}</span>}
        <h1 className="truncate text-sm font-semibold text-fg">{title}</h1>
        {meta && <div className="ml-1 hidden items-center gap-2 sm:flex">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/** Secondary row under the header for tabs, filters and view switchers. */
export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line-subtle px-4 py-2 md:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Main content with an optional contextual panel.
 * ≥1280px the panel docks on the right; below that it opens as a sheet.
 */
export function SplitView({
  children,
  aside,
  asideTitle = "Details",
  onAsideClose,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  asideTitle?: string;
  onAsideClose?: () => void;
  className?: string;
}) {
  const docked = useMediaQuery("(min-width: 1280px)");
  return (
    <div className="flex min-h-0 flex-1">
      <div className={cn("min-w-0 flex-1 overflow-y-auto", className)}>{children}</div>
      {aside &&
        (docked ? (
          <aside
            aria-label={asideTitle}
            className="animate-fade-in flex w-[380px] shrink-0 flex-col border-l border-line-subtle bg-panel"
          >
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line-subtle pl-4 pr-2">
              <span className="flex-1 truncate text-xs font-medium text-fg-subtle">{asideTitle}</span>
              {onAsideClose && (
                <IconButton label="Close panel" size="sm" onClick={onAsideClose}>
                  <X />
                </IconButton>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{aside}</div>
          </aside>
        ) : (
          <Sheet open onOpenChange={(o) => !o && onAsideClose?.()} title={asideTitle}>
            {aside}
          </Sheet>
        ))}
    </div>
  );
}

/** Constrains reading-width content inside a scrolling region. */
export function Container({ children, className, size = "lg" }: { children: ReactNode; className?: string; size?: "md" | "lg" | "xl" }) {
  const max = size === "md" ? "max-w-[720px]" : size === "xl" ? "max-w-[1200px]" : "max-w-[960px]";
  return <div className={cn("mx-auto w-full px-4 md:px-6", max, className)}>{children}</div>;
}

/** Small section heading inside a page. */
export function SectionHeading({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-8 items-center justify-between gap-2", className)}>
      <h2 className="text-xs font-medium text-fg-subtle">{children}</h2>
      {action}
    </div>
  );
}
