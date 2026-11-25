import { CalendarBlankIcon, MapPinIcon, VideoCameraIcon } from "@phosphor-icons/react/ssr";
import { APPS } from "@/components/app-icon";
import { EmptyState, SectionCard } from "@/components/section-card";
import type { EventItem } from "@/lib/types";

export function EventsCard({ items, delay }: { items: EventItem[]; delay?: number }) {
  return (
    <SectionCard
      title="Up next"
      icon={<CalendarBlankIcon size={18} weight="duotone" />}
      href="/calendar"
      delay={delay}
    >
      {items.length === 0 ? (
        <EmptyState>Your calendar is clear.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((event) => (
            <li key={event.id} className="flex items-stretch gap-3 rounded-2xl p-2">
              <div className="w-[4.5rem] shrink-0 text-right font-mono">
                <p className="text-sm font-medium">{event.start}</p>
                <p className="text-xs text-subtle">{event.end}</p>
              </div>
              <span aria-hidden className="bg-brand w-1 shrink-0 rounded-full opacity-70" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{event.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  {event.isVideo ? (
                    <>
                      <VideoCameraIcon size={13} weight="duotone" /> Video call
                    </>
                  ) : event.location ? (
                    <>
                      <MapPinIcon size={13} weight="duotone" /> {event.location}
                    </>
                  ) : (
                    APPS[event.app].label
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
