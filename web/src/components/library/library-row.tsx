"use client";

import { Copy, FileUp, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import type { LibraryItem } from "@/lib/data/types";
import { ItemTile } from "./item-tile";
import { secondaryLine, shareSummary } from "./library-meta";

export interface RowActions {
  onSelect(): void;
  onRename(): void;
  onReplace(): void;
  onCopy(): void;
  onTogglePin(): void;
  onDelete(): void;
}

export function LibraryRow({ item, selected, now, actions }: { item: LibraryItem; selected: boolean; now: Date; actions: RowActions }) {
  return (
    <li className={cn("group relative flex items-center gap-3 border-b border-line-subtle px-4 py-2.5 transition-colors md:px-5", selected ? "bg-pressed" : "hover:bg-hover")}>
      {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-accent" />}
      <ItemTile item={item} size={32} />
      <button type="button" onClick={actions.onSelect} aria-current={selected || undefined} className="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-fg">{item.name}</span>
          {item.pinned && <Pin className="size-3 shrink-0 fill-current text-fg-subtle" aria-label="Pinned" />}
        </span>
        <span className="block truncate text-xs text-fg-subtle">{secondaryLine(item)}</span>
      </button>
      <span className={cn("hidden w-56 shrink-0 truncate text-right text-xs md:block", item.sharing === "never" ? "text-fg-muted" : "text-fg-subtle")}>
        {shareSummary(item, now)}
      </span>
      <Menu>
        <MenuTrigger asChild>
          <IconButton label={`Options for ${item.name}`} size="sm" className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100">
            <MoreHorizontal />
          </IconButton>
        </MenuTrigger>
        <MenuContent align="end" className="min-w-44">
          <MenuItem icon={<Pencil />} onSelect={actions.onRename}>
            Rename
          </MenuItem>
          {item.kind === "file" && (
            <MenuItem icon={<FileUp />} onSelect={actions.onReplace}>
              Replace file
            </MenuItem>
          )}
          {item.kind !== "file" && (
            <MenuItem icon={<Copy />} onSelect={actions.onCopy}>
              {item.kind === "link" ? "Copy link" : "Copy text"}
            </MenuItem>
          )}
          <MenuItem icon={item.pinned ? <PinOff /> : <Pin />} onSelect={actions.onTogglePin}>
            {item.pinned ? "Unpin" : "Pin to top"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 />} danger onSelect={actions.onDelete}>
            Delete
          </MenuItem>
        </MenuContent>
      </Menu>
    </li>
  );
}
