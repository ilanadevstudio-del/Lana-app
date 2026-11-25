import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Quiet bordered section used on Home and in project overviews. */
export function Panel({
  title,
  href,
  hrefLabel = "View all",
  meta,
  children,
  className,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-line bg-panel", className)} aria-label={title}>
      <header className="flex h-10 items-center gap-2 border-b border-line-subtle px-3.5">
        <h2 className="text-xs font-medium text-fg-muted">{title}</h2>
        {meta}
        {href && (
          <Link href={href} className="ml-auto flex items-center gap-0.5 text-xs text-fg-subtle transition-colors hover:text-fg">
            {hrefLabel}
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
