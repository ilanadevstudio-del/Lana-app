"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUi, isTyping, setUi, toggleSidebar } from "@/lib/ui-state";
import { CommandPalette } from "./command-palette";
import { MobileTabBar, MobileTopBar } from "./mobile-nav";
import { ALL_NAV } from "./nav";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { Sidebar } from "./sidebar";

/**
 * Application frame: sidebar on desktop, top bar + tab bar on mobile,
 * plus global overlays (command menu, shortcuts, toasts) and keyboard shortcuts.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useGlobalShortcuts();
  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col bg-canvas md:flex-row">
        <Sidebar />
        <MobileTopBar />
        <main id="main" className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </main>
        <MobileTabBar />
      </div>
      <CommandPalette />
      <ShortcutsDialog />
      <Toaster />
    </TooltipProvider>
  );
}

function useGlobalShortcuts() {
  const router = useRouter();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setUi({ paletteOpen: !getUi().paletteOpen });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e) || e.defaultPrevented) return;
      if (document.querySelector("[role=dialog]")) return;

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const target = ALL_NAV.find((n) => n.key === e.key.toLowerCase());
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }

      switch (e.key) {
        case "g":
          pendingG.current = window.setTimeout(() => (pendingG.current = null), 1200);
          break;
        case "[":
          e.preventDefault();
          toggleSidebar();
          break;
        case "?":
          e.preventDefault();
          setUi({ shortcutsOpen: true });
          break;
        case "n":
          e.preventDefault();
          router.push("/assistant");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
