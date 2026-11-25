"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "./kbd";

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;
export const MenuGroup = DM.Group;
export const MenuRadioGroup = DM.RadioGroup;

const ITEM =
  "relative flex h-8 cursor-default select-none items-center gap-2.5 rounded-md px-2 text-sm text-fg outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-hover data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle";

export function MenuContent({
  children,
  align = "start",
  side = "bottom",
  className,
  sideOffset = 6,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  sideOffset?: number;
}) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "pop-motion z-50 min-w-48 rounded-lg border border-line bg-overlay p-1 shadow-popover focus:outline-none",
          className,
        )}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function MenuItem({
  children,
  icon,
  shortcut,
  onSelect,
  disabled,
  danger,
  trailing,
}: {
  children: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  onSelect?: (e: Event) => void;
  disabled?: boolean;
  danger?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <DM.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(ITEM, danger && "text-danger [&_svg]:text-danger data-[highlighted]:bg-danger-soft")}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {trailing}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </DM.Item>
  );
}

export function MenuRadioItem({ value, children, icon }: { value: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <DM.RadioItem value={value} className={ITEM}>
      {icon}
      <span className="flex-1 truncate">{children}</span>
      <DM.ItemIndicator>
        <Check className="text-accent-text!" />
      </DM.ItemIndicator>
    </DM.RadioItem>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-2 pb-1 pt-1.5 text-2xs font-medium text-fg-subtle">{children}</DM.Label>;
}

export function MenuSeparator() {
  return <DM.Separator className="-mx-1 my-1 h-px bg-line-subtle" />;
}
