export const THEME_STORAGE_KEY = "lana-theme";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

/**
 * Runs before first paint (inlined in the root layout).
 * Dark is the default; "system" follows the OS.
 */
export const themeScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var t=p==="light"?"light":p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):"dark";document.documentElement.setAttribute("data-theme",t);if(localStorage.getItem("lana-sidebar")==="collapsed")document.documentElement.setAttribute("data-sidebar","collapsed")}catch(e){}})()`;

export function readThemePreference(): ThemePreference {
  try {
    const p = localStorage.getItem(THEME_STORAGE_KEY);
    return p === "light" || p === "system" ? p : "dark";
  } catch {
    return "dark";
  }
}

export function applyThemePreference(pref: ThemePreference) {
  const theme: Theme =
    pref === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : pref;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage unavailable: the theme still applies for this session.
  }
}
