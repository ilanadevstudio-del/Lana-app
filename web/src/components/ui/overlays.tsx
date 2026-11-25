"use client";

import * as RD from "@radix-ui/react-dialog";
import * as RP from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";

// ── Dialog ────────────────────────────────────────────────────────────────────

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  hideHeader,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  hideHeader?: boolean;
}) {
  const width = size === "sm" ? "max-w-[400px]" : size === "lg" ? "max-w-[640px]" : "max-w-[480px]";
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="scrim-motion fixed inset-0 z-50 bg-(--scrim)" />
        <RD.Content
          className={cn(
            "dialog-motion fixed left-1/2 top-1/2 z-50 flex max-h-[min(85dvh,720px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line bg-overlay shadow-dialog focus:outline-none",
            width,
          )}
        >
          {hideHeader ? (
            <RD.Title className="sr-only">{title}</RD.Title>
          ) : (
            <div className="flex items-start gap-3 px-5 pb-2 pt-4">
              <div className="min-w-0 flex-1">
                <RD.Title className="text-base font-semibold text-fg">{title}</RD.Title>
                {description && (
                  <RD.Description className="mt-1 text-sm text-fg-muted">{description}</RD.Description>
                )}
              </div>
              <RD.Close asChild>
                <IconButton label="Close" size="sm" className="-mr-1.5 -mt-0.5">
                  <X />
                </IconButton>
              </RD.Close>
            </div>
          )}
          {!description && !hideHeader && <RD.Description className="sr-only">{title}</RD.Description>}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line-subtle px-5 py-3">{footer}</div>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

// ── Sheet: slides from an edge; used for the context panel on small screens and mobile menus ──

export function Sheet({
  open,
  onOpenChange,
  title,
  side = "right",
  children,
  className,
  showTitle = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: "right" | "left" | "bottom";
  children: ReactNode;
  className?: string;
  showTitle?: boolean;
}) {
  const position = {
    right: "sheet-right-motion inset-y-0 right-0 h-full w-[min(420px,100vw)] border-l",
    left: "sheet-left-motion inset-y-0 left-0 h-full w-[min(300px,85vw)] border-r",
    bottom:
      "sheet-bottom-motion inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t pb-[env(safe-area-inset-bottom)]",
  }[side];
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="scrim-motion fixed inset-0 z-50 bg-(--scrim)" />
        <RD.Content
          className={cn("fixed z-50 flex flex-col border-line bg-panel shadow-dialog focus:outline-none", position, className)}
        >
          {side === "bottom" && <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong" />}
          {showTitle ? (
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line-subtle px-4">
              <RD.Title className="flex-1 truncate text-sm font-semibold">{title}</RD.Title>
              <RD.Close asChild>
                <IconButton label="Close" size="sm">
                  <X />
                </IconButton>
              </RD.Close>
            </div>
          ) : (
            <RD.Title className="sr-only">{title}</RD.Title>
          )}
          <RD.Description className="sr-only">{title}</RD.Description>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

// ── Popover ───────────────────────────────────────────────────────────────────

export const Popover = RP.Root;
export const PopoverTrigger = RP.Trigger;
export const PopoverAnchor = RP.Anchor;
export const PopoverClose = RP.Close;

export function PopoverContent({
  children,
  className,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  onOpenAutoFocus,
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  onOpenAutoFocus?: (e: Event) => void;
}) {
  return (
    <RP.Portal>
      <RP.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={12}
        onOpenAutoFocus={onOpenAutoFocus}
        className={cn(
          "pop-motion z-50 rounded-lg border border-line bg-overlay p-1 text-sm shadow-popover focus:outline-none",
          className,
        )}
      >
        {children}
      </RP.Content>
    </RP.Portal>
  );
}
