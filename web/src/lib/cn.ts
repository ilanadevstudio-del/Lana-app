import { twMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined | 0;

/**
 * Joins class names, skipping falsy values, and resolves Tailwind conflicts so a
 * `className` override (e.g. `py-0` over a component's `py-2`) reliably wins.
 */
export function cn(...classes: ClassValue[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}
