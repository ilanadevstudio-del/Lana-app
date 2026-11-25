"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Menu, MenuContent, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "./menu";

/** Compact single-select filter: "Project: All ▾". Highlights when a non-default value is chosen. */
export function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  defaultValue = "all" as T,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  icon?: ReactNode;
  defaultValue?: T;
}) {
  const current = options.find((o) => o.value === value);
  const active = value !== defaultValue;
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors data-[state=open]:bg-hover [&_svg]:size-3.5",
            active ? "border-accent-line bg-accent-soft text-fg" : "border-line text-fg-muted hover:bg-hover hover:text-fg",
          )}
        >
          {icon}
          <span className="text-fg-subtle">{label}</span>
          <span>{current?.label}</span>
          <ChevronDown className="text-fg-faint" />
        </button>
      </MenuTrigger>
      <MenuContent align="start" className="max-h-80 overflow-y-auto">
        <MenuLabel>{label}</MenuLabel>
        <MenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <MenuRadioItem key={o.value} value={o.value} icon={o.icon}>
              {o.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
