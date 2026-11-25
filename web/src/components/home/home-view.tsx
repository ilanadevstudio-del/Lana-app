"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Composer } from "@/components/lana/composer";
import { SuggestionList } from "@/components/lana/suggestions";
import { Skeleton } from "@/components/ui/feedback";
import { startConversation } from "@/lib/assistant/engine";
import type { SendInput } from "@/lib/assistant/types";
import { useActivity } from "@/lib/data/activity";
import { eventsOnDay, useEvents } from "@/lib/data/calendar";
import { isDueToday, isOverdue, useTasks } from "@/lib/data/tasks";
import { useUser } from "@/lib/data/workspace";
import { formatLongDate, greeting, plural } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { AttentionPanel } from "./attention-panel";
import { RecentActivity } from "./recent-activity";
import { TodaySchedule } from "./today-schedule";

export function HomeView() {
  const router = useRouter();
  const start = (input: SendInput) => {
    const id = startConversation(input);
    router.push(`/assistant/${id}`);
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-8 md:px-8 md:pt-14">
        <div className="mx-auto max-w-[720px]">
          <Greeting />
          <Composer variant="hero" onSubmit={start} className="mt-6" />
          <SuggestionList onPick={(s) => start({ text: s.prompt })} className="mt-3" limit={4} />
        </div>

        <div className="mt-12 grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <TodaySchedule />
          <div className="flex min-w-0 flex-col gap-4">
            <AttentionPanel />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}

function Greeting() {
  const now = useNow();
  const user = useUser();
  const events = useEvents();
  const tasks = useTasks();
  const activity = useActivity();

  if (!now || !user || !events || !tasks || !activity) {
    return (
      <div aria-hidden>
        <Skeleton className="h-7 w-72" />
        <Skeleton className="mt-2.5 h-4 w-96 max-w-full" />
      </div>
    );
  }

  const upcoming = eventsOnDay(events, now).filter((e) => e.allDay || new Date(e.end) > now).length;
  const due = tasks.filter((t) => t.status !== "done" && (isDueToday(t) || isOverdue(t))).length;
  const approvals = activity.filter((a) => a.status === "awaiting_approval").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">
        {greeting(now)}, {user.firstName}
      </h1>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-subtle">
        <span>{formatLongDate(now)}</span>
        <Dot />
        <Link href="/calendar" className="hover:text-fg">
          {upcoming ? `${plural(upcoming, "event")} left today` : "No more events today"}
        </Link>
        <Dot />
        <Link href="/tasks" className="hover:text-fg">
          {plural(due, "task")} due
        </Link>
        {approvals > 0 && (
          <>
            <Dot />
            <Link href="/activity" className="inline-flex items-center gap-1 font-medium text-warning hover:underline">
              {plural(approvals, "approval")} waiting
              <ArrowRight className="size-3" />
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

const Dot = () => (
  <span aria-hidden className="text-fg-faint">
    ·
  </span>
);
