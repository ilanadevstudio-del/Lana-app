import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  href?: string;
  count?: number;
  /** Entrance stagger, in ms. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function SectionCard({ title, icon, href, count, delay = 0, className, children }: SectionCardProps) {
  return (
    <section
      className={`glass animate-rise flex flex-col rounded-[28px] p-4 text-left sm:p-5 ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="mb-3 flex items-center gap-3">
        <span className="glass-strong grid size-9 place-items-center rounded-full text-accent">{icon}</span>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{count}</span>
        )}
        {href && (
          <Link
            href={href}
            aria-label={`Open ${title}`}
            className="group glass-strong ml-auto grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
          >
            <ArrowUpRightIcon
              size={16}
              weight="bold"
              className="transition-transform duration-300 ease-[cubic-bezier(.3,1.6,.5,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-sm text-subtle">{children}</p>;
}
