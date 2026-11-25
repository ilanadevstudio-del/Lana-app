import type { HomeData } from "@/lib/types";

// Mock data for designing the Home screen. Replaced by Supabase queries later.
export const homeData: HomeData = {
  user: { firstName: "Emmanuel" },

  approvals: [
    {
      id: "apr_1",
      app: "gmail",
      action: "Send email to Tobi",
      detail: "“Hey Tobi, can we have a quick call by 2:30 today?”",
      requestedAt: "2 min ago",
    },
    {
      id: "apr_2",
      app: "github",
      action: "Merge PR #22 on EventFi",
      detail: "feat: ticket QR check-in · 3 approvals · checks passing",
      requestedAt: "18 min ago",
    },
  ],

  tasks: [
    {
      id: "tsk_1",
      title: "Finish the Lana landing page",
      priority: "high",
      due: "Today",
      category: "Lana",
      done: false,
    },
    {
      id: "tsk_2",
      title: "Review the EventFi sponsorship deck",
      priority: "medium",
      due: "Today",
      category: "EventFi",
      done: false,
    },
    {
      id: "tsk_3",
      title: "Reply to the design contractor",
      priority: "low",
      due: "Today",
      done: true,
    },
  ],

  reminders: [
    { id: "rem_1", title: "Review the proposal", when: "Tomorrow, 9:00 AM", recurrence: "Every weekday" },
    { id: "rem_2", title: "Submit the grant application", when: "Fri, 10:00 AM" },
    { id: "rem_3", title: "Call Mum", when: "Sun, 6:00 PM", recurrence: "Weekly" },
  ],

  events: [
    {
      id: "evt_1",
      title: "Product sync with Tobi",
      start: "2:30 PM",
      end: "3:00 PM",
      app: "google-calendar",
      isVideo: true,
    },
    {
      id: "evt_2",
      title: "EventFi partner review",
      start: "4:00 PM",
      end: "5:00 PM",
      app: "google-calendar",
      location: "Yaba, Lagos",
    },
  ],

  activity: [
    { id: "act_1", app: "github", summary: "Summarised 4 open PRs on EventFi", state: "completed", at: "10 min ago" },
    { id: "act_2", app: "lana", summary: "Created task “Finish the Lana landing page”", state: "completed", at: "1 h ago" },
    { id: "act_3", app: "notion", summary: "Create page from meeting notes", state: "partially_completed", at: "2 h ago" },
    { id: "act_4", app: "whatsapp", summary: "Send “running late” to Ada", state: "failed", at: "Yesterday" },
  ],
};
