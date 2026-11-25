/**
 * UI view models for the Home screen.
 *
 * Display strings (times, dates) are pre-formatted for now because the data is mocked.
 * When the backend lands, these become ISO timestamps formatted in the user's saved time zone.
 */

export type AppId = "lana" | "gmail" | "github" | "google-calendar" | "notion" | "whatsapp";

/** Assistant/action lifecycle from PRD §6.3. */
export type ActionState =
  | "understanding"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "failed"
  | "partially_completed";

export type Priority = "high" | "medium" | "low";

export interface TaskItem {
  id: string;
  title: string;
  priority: Priority;
  due: string;
  category?: string;
  done: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  when: string;
  recurrence?: string;
}

export interface EventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  app: AppId;
  location?: string;
  isVideo?: boolean;
}

export interface ApprovalItem {
  id: string;
  app: AppId;
  action: string;
  detail: string;
  requestedAt: string;
}

export interface ActivityItem {
  id: string;
  app: AppId;
  summary: string;
  state: ActionState;
  at: string;
}

export interface HomeData {
  user: { firstName: string };
  approvals: ApprovalItem[];
  tasks: TaskItem[];
  reminders: ReminderItem[];
  events: EventItem[];
  activity: ActivityItem[];
}
