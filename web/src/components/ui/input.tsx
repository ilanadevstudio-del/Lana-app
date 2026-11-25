import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded-md border border-line bg-panel text-sm text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-accent-line focus:outline-none focus:ring-3 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger/60 aria-invalid:focus:ring-danger-soft";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: ReactNode;
  trailing?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, size = "md", className, ...props },
  ref,
) {
  const h = size === "sm" ? "h-7 text-xs" : size === "lg" ? "h-9" : "h-8";
  return (
    <div className={cn("relative flex items-center", className)}>
      {icon && (
        <span className="pointer-events-none absolute left-2.5 text-fg-subtle [&_svg]:size-3.5">{icon}</span>
      )}
      <input ref={ref} className={cn(FIELD, h, icon ? "pl-8" : "pl-2.5", trailing ? "pr-9" : "pr-2.5")} {...props} />
      {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(FIELD, "min-h-20 resize-y px-2.5 py-2 leading-5", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      <select ref={ref} className={cn(FIELD, "h-8 appearance-none pl-2.5 pr-8")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
});

/** Label + control + hint/error, with ids wired for accessibility. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const descId = hint || error ? `${id}-desc` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline gap-1.5 text-xs font-medium text-fg-muted">
        {label}
        {optional && <span className="font-normal text-fg-faint">Optional</span>}
      </label>
      {children({ id, "aria-describedby": descId, "aria-invalid": error ? true : undefined })}
      {(error || hint) && (
        <p id={descId} className={cn("text-xs", error ? "text-danger" : "text-fg-subtle")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
