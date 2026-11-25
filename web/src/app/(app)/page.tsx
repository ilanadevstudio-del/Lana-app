import Link from "next/link";
import { ActivityCard } from "@/components/home/activity-card";
import { ApprovalsCard } from "@/components/home/approvals-card";
import { AskBar } from "@/components/home/ask-bar";
import { EventsCard } from "@/components/home/events-card";
import { Greeting } from "@/components/home/greeting";
import { RemindersCard } from "@/components/home/reminders-card";
import { TasksCard } from "@/components/home/tasks-card";
import { Orb } from "@/components/orb";
import { homeData } from "@/lib/mock/home";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function HomePage() {
  const { user, approvals, tasks, reminders, events, activity } = homeData;
  const openTasks = tasks.filter((t) => !t.done).length;
  const summary = `${plural(openTasks, "task")} · ${plural(events.length, "event")}`;

  return (
    <>
      <section className="flex flex-col items-center pb-8 pt-6 text-center md:pt-2">
        <Link
          href="/assistant"
          aria-label="Talk to Lana"
          className="rounded-full transition-transform duration-500 ease-[cubic-bezier(.3,1.6,.5,1)] hover:scale-105"
        >
          <Orb size={132} state={approvals.length > 0 ? "awaiting_approval" : "idle"} />
        </Link>
        <Greeting name={user.firstName} summary={summary} />
      </section>

      <div className="flex flex-col gap-4">
        <ApprovalsCard items={approvals} />
        <div className="grid gap-4 md:grid-cols-2">
          <TasksCard items={tasks} delay={80} />
          <EventsCard items={events} delay={160} />
          <RemindersCard items={reminders} delay={240} />
          <ActivityCard items={activity} delay={320} />
        </div>
      </div>

      <AskBar />
    </>
  );
}
