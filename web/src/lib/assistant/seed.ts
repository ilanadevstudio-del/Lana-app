import { daysAgo, hoursAgo } from "@/lib/mock/clock";
import type { Conversation, Message } from "./types";

/** Sample conversation history (preview data). */

const conv = (id: string, title: string, at: string, messages: Message[]): Conversation => ({
  id,
  title,
  messages,
  phase: "idle",
  busy: false,
  createdAt: at,
  updatedAt: at,
});

const user = (id: string, text: string, at: string): Message => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
  createdAt: at,
});

export function seedConversations(): Conversation[] {
  const t1 = hoursAgo(4);
  const t2 = hoursAgo(6);
  const t3 = daysAgo(6, "19:08");
  const t4 = daysAgo(14, "20:15");
  const t5 = daysAgo(7, "09:02");

  return [
    conv("c_prs", "EventFi pull requests", t1, [
      user("m1", "Check my GitHub pull requests and summarise the ones that need attention.", t1),
      {
        id: "m2",
        role: "assistant",
        createdAt: t1,
        parts: [
          {
            type: "action",
            action: {
              id: "act_prs",
              integrationId: "github",
              title: "Review open pull requests on EventFi",
              status: "succeeded",
              startedAt: t1,
              finishedAt: t1,
              simulated: true,
              summary: "4 open · 1 ready to merge · 1 failing",
              steps: [
                { id: "s1", label: "Connect to GitHub", state: "done", detail: "Signed in as ilanadevstudio-del" },
                { id: "s2", label: "Fetch open pull requests", state: "done", detail: "4 open" },
                { id: "s3", label: "Check reviews and CI status", state: "done", detail: "6 checks, 5 reviews" },
                { id: "s4", label: "Analyse what needs attention", state: "done" },
              ],
              links: [{ label: "Open on GitHub", href: "https://github.com" }],
            },
          },
          {
            type: "text",
            text:
              "Two of the four open PRs need you.\n\n" +
              "| PR | Status | Needs |\n| --- | --- | --- |\n" +
              "| **#22** ticket QR check-in | 3 approvals, checks passing | Your merge |\n" +
              "| **#19** upgrade to Next 16 | 2 failing checks (lint, e2e) | A decision: fix or revert |\n" +
              "| #21 timezone on reminders | Waiting on Tobi's review | Nothing yet |\n" +
              "| #17 sponsor dashboard | Draft, idle for 6 days | Nothing yet |\n\n" +
              "**#22 is ready.** Want me to merge it?",
          },
        ],
      },
    ]),
    conv("c_notion", "Partner sync notes", t2, [
      user("m1", "Turn my partner sync notes into a Notion page and share it with Tobi", t2),
      {
        id: "m2",
        role: "assistant",
        createdAt: t2,
        parts: [
          {
            type: "action",
            action: {
              id: "act_notion",
              integrationId: "notion",
              title: "Create page from meeting notes",
              status: "partially_completed",
              startedAt: t2,
              finishedAt: t2,
              simulated: true,
              summary: "Page created; sharing failed",
              steps: [
                { id: "s1", label: "Create page “Partner sync notes”", state: "done", detail: "In EventFi / Meetings" },
                { id: "s2", label: "Add notes and action items", state: "done", detail: "3 action items" },
                { id: "s3", label: "Share the page with Tobi", state: "failed", detail: "No permission to share in this workspace" },
              ],
              links: [{ label: "Open in Notion", href: "https://www.notion.so" }],
            },
          },
          {
            type: "text",
            text: "I created the page and added your notes, but **I couldn't share it with Tobi**: Notion says you don't have sharing permission in that workspace.",
          },
        ],
      },
    ]),
    conv("c_move", "Apartment move checklist", t3, [
      user("m1", "Add a task to book the movers for moving day", t3),
      {
        id: "m2",
        role: "assistant",
        createdAt: t3,
        parts: [
          {
            type: "action",
            action: {
              id: "act_move",
              integrationId: "lana",
              title: "Create a task",
              status: "succeeded",
              startedAt: t3,
              finishedAt: t3,
              simulated: true,
              summary: "Book the movers for moving day",
              steps: [
                { id: "s1", label: "Work out the details", state: "done", detail: "Medium · Apartment move" },
                { id: "s2", label: "Save to your tasks", state: "done", detail: "Saved" },
              ],
            },
          },
          { type: "text", text: "Added **Book the movers for moving day** to your Apartment move project." },
        ],
      },
    ]),
    conv("c_invoice", "Orbit Pay invoice", t5, [
      user("m1", "Send the final invoice to Orbit Pay", t5),
      {
        id: "m2",
        role: "assistant",
        createdAt: t5,
        parts: [{ type: "text", text: "Sent. Gmail confirmed delivery to **finance@orbitpay.example** with `INV-0042.pdf` attached." }],
      },
    ]),
    conv("c_mum", "Call Mum reminder", t4, [
      user("m1", "Remind me to call Mum every Sunday at 6pm", t4),
      {
        id: "m2",
        role: "assistant",
        createdAt: t4,
        parts: [{ type: "text", text: "Done. I'll remind you to call Mum **every Sunday at 6:00 PM**." }],
      },
    ]),
  ];
}
