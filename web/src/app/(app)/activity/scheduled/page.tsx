import type { Metadata } from "next";
import { ScheduledView } from "@/components/activity/scheduled-view";

export const metadata: Metadata = { title: "Scheduled actions" };

export default function ScheduledPage() {
  return <ScheduledView />;
}
