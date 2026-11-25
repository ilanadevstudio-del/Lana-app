import type { Metadata } from "next";
import { HistoryView } from "@/components/activity/history-view";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return <HistoryView />;
}
