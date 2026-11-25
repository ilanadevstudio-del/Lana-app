import type { CategoryColor } from "@/lib/data/types";

/** Category colour utilities. Full class names so Tailwind can see them. */
export const CATEGORY_BG: Record<CategoryColor, string> = {
  blue: "bg-cat-blue",
  violet: "bg-cat-violet",
  green: "bg-cat-green",
  amber: "bg-cat-amber",
  rose: "bg-cat-rose",
  teal: "bg-cat-teal",
  slate: "bg-cat-slate",
};

export const CATEGORY_TEXT: Record<CategoryColor, string> = {
  blue: "text-cat-blue",
  violet: "text-cat-violet",
  green: "text-cat-green",
  amber: "text-cat-amber",
  rose: "text-cat-rose",
  teal: "text-cat-teal",
  slate: "text-cat-slate",
};

/** Soft fill for event blocks: the category colour at low opacity. */
export const CATEGORY_SOFT: Record<CategoryColor, string> = {
  blue: "bg-cat-blue/14 hover:bg-cat-blue/20",
  violet: "bg-cat-violet/14 hover:bg-cat-violet/20",
  green: "bg-cat-green/14 hover:bg-cat-green/20",
  amber: "bg-cat-amber/14 hover:bg-cat-amber/20",
  rose: "bg-cat-rose/14 hover:bg-cat-rose/20",
  teal: "bg-cat-teal/14 hover:bg-cat-teal/20",
  slate: "bg-cat-slate/14 hover:bg-cat-slate/20",
};

export const CATEGORY_BORDER: Record<CategoryColor, string> = {
  blue: "border-cat-blue",
  violet: "border-cat-violet",
  green: "border-cat-green",
  amber: "border-cat-amber",
  rose: "border-cat-rose",
  teal: "border-cat-teal",
  slate: "border-cat-slate",
};
