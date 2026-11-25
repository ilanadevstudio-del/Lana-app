"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.getAttribute("data-theme") as Theme | null;
const getServerSnapshot = () => null;

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode etc.) — theme still applies for this session.
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`glass-strong grid size-10 place-items-center overflow-hidden rounded-full text-foreground ${className ?? ""}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme && (
          <motion.span
            key={theme}
            initial={{ y: 14, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -14, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="grid place-items-center"
          >
            {isDark ? <MoonIcon size={18} weight="duotone" /> : <SunIcon size={18} weight="duotone" />}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
