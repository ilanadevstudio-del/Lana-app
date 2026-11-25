type ClassValue = string | false | null | undefined | 0;

/** Joins class names, skipping falsy values. Components avoid conflicting utilities, so no merge step is needed. */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}
