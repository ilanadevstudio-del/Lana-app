"use client";

import * as RT from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { Kbd } from "./kbd";

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <RT.Provider delayDuration={350} skipDelayDuration={200}>
    {children}
  </RT.Provider>
);

export function Tooltip({
  content,
  shortcut,
  side = "top",
  align = "center",
  children,
  disabled,
}: {
  content: ReactNode;
  shortcut?: string[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) return <>{children}</>;
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          align={align}
          sideOffset={6}
          className="pop-motion z-50 flex items-center gap-2 rounded-md border border-line bg-overlay px-2 py-1 text-xs text-fg shadow-popover"
        >
          {content}
          {shortcut && (
            <span className="flex gap-0.5">
              {shortcut.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          )}
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
