import { BellRingingIcon, RepeatIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, SectionCard } from "@/components/section-card";
import type { ReminderItem } from "@/lib/types";

export function RemindersCard({ items, delay }: { items: ReminderItem[]; delay?: number }) {
  return (
    <SectionCard
      title="Reminders"
      icon={<BellRingingIcon size={18} weight="duotone" />}
      href="/tasks"
      delay={delay}
    >
      {items.length === 0 ? (
        <EmptyState>No upcoming reminders.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl p-2">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs text-muted">{r.when}</p>
              </div>
              {r.recurrence && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  <RepeatIcon size={12} weight="bold" />
                  {r.recurrence}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
