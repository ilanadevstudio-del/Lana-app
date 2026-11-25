import { ActivityShell } from "@/components/activity/activity-shell";

export default function ActivityLayout({ children }: LayoutProps<"/activity">) {
  return <ActivityShell>{children}</ActivityShell>;
}
