import type { Metadata } from "next";
import { HistoryView } from "@/components/activity/history-view";

export const metadata: Metadata = { title: "Needs review" };

export default function ReviewPage() {
  return <HistoryView review />;
}
