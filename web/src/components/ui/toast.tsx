"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Tiny toast system: `toast({ title })` from anywhere, <Toaster /> renders once in the shell.
 * Bottom-right on desktop, top on mobile so it never covers the composer or tab bar.
 */

type ToastTone = "neutral" | "success" | "danger";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(input: { title: string; description?: string; tone?: ToastTone; action?: ToastItem["action"]; duration?: number }) {
  const id = nextId++;
  items = [...items.slice(-2), { id, tone: "neutral", ...input }];
  emit();
  setTimeout(() => dismissToast(id), input.duration ?? (input.action ? 6000 : 3600));
  return id;
}

const EMPTY: ToastItem[] = [];

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => EMPTY,
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-4 md:right-4 md:top-auto md:items-end"
    >
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-rise pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-lg border border-line bg-overlay px-3 py-2.5 shadow-popover"
        >
          <span className="mt-0.5 [&_svg]:size-4">
            {t.tone === "success" ? (
              <CheckCircle2 className="text-success" />
            ) : t.tone === "danger" ? (
              <XCircle className="text-danger" />
            ) : (
              <Info className="text-fg-subtle" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-fg-muted">{t.description}</p>}
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
              className="h-6 shrink-0 rounded px-1.5 text-xs font-medium text-accent-text hover:bg-accent-soft"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(t.id)}
            className={cn("grid size-6 shrink-0 place-items-center rounded text-fg-subtle hover:bg-hover hover:text-fg")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
