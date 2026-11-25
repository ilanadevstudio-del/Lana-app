"use client";

import { useSyncExternalStore } from "react";
import { applyThemePreference, readThemePreference, THEME_STORAGE_KEY, type ThemePreference } from "./theme";

const EVENT = "lana-theme-change";

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === THEME_STORAGE_KEY && onChange();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setThemePreference(pref: ThemePreference) {
  applyThemePreference(pref);
  window.dispatchEvent(new Event(EVENT));
}

/** The saved theme preference ("dark" | "light" | "system"), kept in sync across components and tabs. */
export function useThemePreference() {
  const pref = useSyncExternalStore(subscribe, readThemePreference, () => "dark" as ThemePreference);
  return [pref, setThemePreference] as const;
}
