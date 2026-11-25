"use client";

import type { ReactNode } from "react";
import { CalendarClock, GitPullRequest, ListChecks, Sparkles, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { useActivity } from "@/lib/data/activity";
import { useEvents } from "@/lib/data/calendar";
import { isDueToday, isOverdue, useTasks } from "@/lib/data/tasks";
import { formatTime, plural } from "@/lib/format";

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon: ReactNode;
  hint?: string;
}

/** Suggestions derived from the user's actual day, so they're useful rather than generic. */
export function useSuggestions(): Suggestion[] | null {
  const activity = useActivity();
  const events = useEvents();
  const tasks = useTasks();
  if (!activity || !events || !tasks) return null;

  const now = new Date();
  const pending = activity.filter((a) => a.status === "awaiting_approval").length;
  const next = events
    .filter((e) => !e.allDay && new Date(e.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const todayCount = tasks.filter((t) => t.status !== "done" && (isDueToday(t) || isOverdue(t))).length;

  const list: Suggestion[] = [
    {
      id: "attention",
      label: "Summarise what needs my attention",
      prompt: "What needs my attention?",
      icon: <Sparkles />,
      hint: pending ? plural(pending, "approval") : undefined,
    },
  ];
  if (next)
    list.push({
      id: "prep",
      label: `Prepare for ${next.title}`,
      prompt: "Prepare for my next meeting",
      icon: <CalendarClock />,
      hint: formatTime(next.start),
    });
  list.push(
    { id: "organise", label: "Organise my tasks for today", prompt: "Organise my tasks for today", icon: <ListChecks />, hint: todayCount ? plural(todayCount, "task") : undefined },
    { id: "prs", label: "Show my open GitHub pull requests", prompt: "Check my GitHub pull requests and summarise the ones that need attention", icon: <GitPullRequest /> },
    { id: "schedule", label: "Review my schedule", prompt: "What's on my calendar today?", icon: <Sun /> },
  );
  return list;
}

export function SuggestionList({
  onPick,
  className,
  limit = 5,
}: {
  onPick: (s: Suggestion) => void;
  className?: string;
  limit?: number;
}) {
  const suggestions = useSuggestions();
  if (!suggestions) {
    return (
      <div className={cn("flex flex-col gap-1", className)} aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    );
  }
  return (
    <ul className={cn("flex flex-col", className)} aria-label="Suggestions">
      {suggestions.slice(0, limit).map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className="group flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg"
          >
            <span className="text-fg-subtle transition-colors group-hover:text-accent-text [&_svg]:size-4">{s.icon}</span>
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            {s.hint && <span className="shrink-0 text-xs text-fg-faint">{s.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
