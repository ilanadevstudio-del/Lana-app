"use client";

import * as RTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Switch ────────────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-50",
        checked ? "border-accent bg-accent" : "border-line-strong bg-raised",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute size-3 rounded-full bg-white shadow-sm transition-transform duration-150",
          checked ? "translate-x-[15px]" : "translate-x-[2px] bg-fg-muted",
        )}
      />
    </button>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
        checked ? "border-accent bg-accent text-on-accent" : "border-line-strong hover:border-fg-subtle",
        className,
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

// ── Segmented control: compact view switchers (List / Board, Month / Week / Day) ──

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-panel p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] font-medium transition-colors [&_svg]:size-3.5",
              size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-xs",
              active ? "bg-raised text-fg shadow-[0_0_0_1px_var(--line)]" : "text-fg-subtle hover:text-fg",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Tabs: underline style for page sections ──────────────────────────────────

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  children,
  className,
  listClassName,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; count?: number }[];
  children?: ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <RTabs.Root value={value} onValueChange={(v) => onChange(v as T)} className={className}>
      <RTabs.List className={cn("flex gap-4 overflow-x-auto border-b border-line-subtle", listClassName)}>
        {items.map((i) => (
          <RTabs.Trigger
            key={i.value}
            value={i.value}
            className="relative -mb-px flex h-9 shrink-0 items-center gap-1.5 border-b-2 border-transparent text-sm font-medium text-fg-subtle transition-colors hover:text-fg data-[state=active]:border-fg data-[state=active]:text-fg"
          >
            {i.label}
            {i.count !== undefined && i.count > 0 && (
              <span className="rounded bg-hover px-1 text-2xs tabular-nums text-fg-muted">{i.count}</span>
            )}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  );
}

export const TabPanel = RTabs.Content;

// ── Setting row: label/description on the left, control on the right ────────

export function SettingRow({
  title,
  description,
  children,
  htmlFor,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
            {title}
          </label>
        ) : (
          <p className="text-sm font-medium text-fg">{title}</p>
        )}
        {description && <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
