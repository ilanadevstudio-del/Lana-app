"use client";

import { Dialog } from "@/components/ui/overlays";
import { Kbd } from "@/components/ui/kbd";
import { setUi, useUi } from "@/lib/ui-state";
import { ALL_NAV } from "./nav";

const GROUPS: { title: string; items: [string, string[]][] }[] = [
  {
    title: "General",
    items: [
      ["Open command menu", ["Ctrl", "K"]],
      ["Toggle sidebar", ["["]],
      ["Show keyboard shortcuts", ["?"]],
      ["New conversation", ["N"]],
    ],
  },
  {
    title: "Composer",
    items: [
      ["Send message", ["Enter"]],
      ["New line", ["Shift", "Enter"]],
      ["Focus composer", ["/"]],
      ["Add context", ["@"]],
    ],
  },
  {
    title: "Approvals",
    items: [["Approve focused action", ["Ctrl", "Enter"]]],
  },
  {
    title: "Tasks",
    items: [
      ["New task", ["C"]],
      ["Move selection", ["J", "K"]],
      ["Complete selected task", ["X"]],
    ],
  },
  {
    title: "Navigation",
    items: ALL_NAV.map((n) => [`Go to ${n.label}`, ["G", n.key.toUpperCase()]]),
  },
];

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  return (
    <Dialog open={open} onOpenChange={(o) => setUi({ shortcutsOpen: o })} title="Keyboard shortcuts" size="lg">
      <div className="grid gap-x-8 gap-y-5 pb-2 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 className="mb-1.5 text-xs font-medium text-fg-subtle">{g.title}</h3>
            <ul>
              {g.items.map(([label, keys]) => (
                <li key={label} className="flex h-8 items-center justify-between gap-4 border-b border-line-subtle text-sm last:border-0">
                  <span className="text-fg-muted">{label}</span>
                  <span className="flex gap-1">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
