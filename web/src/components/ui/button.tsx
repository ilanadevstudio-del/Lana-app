import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] hover:bg-accent-hover disabled:bg-accent/50",
  secondary: "bg-raised text-fg border border-line hover:border-line-strong hover:bg-pressed",
  outline: "text-fg border border-line hover:bg-hover hover:border-line-strong",
  ghost: "text-fg-muted hover:bg-hover hover:text-fg",
  danger: "bg-danger text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
  md: "h-8 gap-2 rounded-md px-3 text-sm [&_svg]:size-4",
  lg: "h-9 gap-2 rounded-lg px-3.5 text-sm [&_svg]:size-4",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "size-7 rounded-md [&_svg]:size-3.5",
  md: "size-8 rounded-md [&_svg]:size-4",
  lg: "size-9 rounded-lg [&_svg]:size-[18px]",
};

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,filter] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-line disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

/** Shared class builder so links can look like buttons. */
export function buttonStyles({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function iconButtonStyles({
  variant = "ghost",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(BASE, VARIANTS[variant], ICON_SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, trailing, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
      {trailing}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: becomes the accessible name. Wrap in <Tooltip> to show it on hover. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", size = "md", className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={iconButtonStyles({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
});
