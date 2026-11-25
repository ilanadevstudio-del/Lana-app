import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import { AppIcon } from "@/components/app-icon";
import { EmptyState, SectionCard } from "@/components/section-card";
import { StateBadge } from "@/components/state-badge";
import type { ActivityItem } from "@/lib/types";

export function ActivityCard({ items, delay }: { items: ActivityItem[]; delay?: number }) {
  return (
    <SectionCard
      title="Recent activity"
      icon={<ClockCounterClockwiseIcon size={18} weight="duotone" />}
      href="/activity"
      delay={delay}
    >
      {items.length === 0 ? (
        <EmptyState>Lana hasn’t done anything yet.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl p-2">
              <AppIcon app={a.app} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.summary}</p>
                <p className="text-xs text-subtle">{a.at}</p>
              </div>
              <StateBadge state={a.state} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
