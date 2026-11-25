"use client";

import { getActivityList } from "@/lib/data/activity";
import { eventsOnDay, freeSlots, getEvents } from "@/lib/data/calendar";
import { createTask, getTasks, isDueToday, isOverdue, PRIORITY_LABELS } from "@/lib/data/tasks";
import { getProjects } from "@/lib/data/workspace";
import { addDays, formatDay, formatTime, formatTimeRange, plural, toDateKey } from "@/lib/format";
import type { Script } from "./engine";

/**
 * Demo scenarios. Matching is keyword-based; the real engine uses the model's tool selection.
 * Scenarios that only read or write LANA's own data use the preview stores, so answers match the rest of the app.
 * Scenarios that would touch an external service are simulated and never claim verification they don't have.
 */

const REPO = "ilanadevstudio-del/eventfi";

const githubPrs: Script = async (ctx) => {
  const a = ctx.action({
    app: "github",
    title: "Review open pull requests on EventFi",
    steps: ["Connect to GitHub", "Fetch open pull requests", "Check reviews and CI status", "Analyse what needs attention"],
  });
  await a.run(0, "Signed in as ilanadevstudio-del");
  await a.run(1, `${REPO} · 4 open`);
  await a.run(2, "6 checks, 5 reviews");
  await a.run(3);
  a.finish({
    verified: true,
    summary: "4 open · 1 ready to merge · 1 failing",
    links: [{ label: "Open on GitHub", href: `https://github.com/${REPO}/pulls` }],
  });
  await ctx.say(
    "Two of the four open PRs need you.\n\n" +
      "| PR | Status | Needs |\n" +
      "| --- | --- | --- |\n" +
      "| **#22** ticket QR check-in | 3 approvals, checks passing | Your merge |\n" +
      "| **#19** upgrade to Next 16 | 2 failing checks (lint, e2e) | A decision: fix or revert |\n" +
      "| #21 timezone on reminders | Waiting on Tobi's review | Nothing yet |\n" +
      "| #17 sponsor dashboard | Draft, idle for 6 days | Nothing yet |\n\n" +
      "**#22 is ready.** The e2e failure on **#19** looks related to the async `params` change in Next 16. Want me to merge #22, or draft a review for #19?",
  );
};

const githubMerge: Script = async (ctx) => {
  await ctx.say("Merging changes `main`, so I'll need your go-ahead first.");
  const a = ctx.action({
    app: "github",
    title: "Merge PR #22 on EventFi",
    steps: ["Check PR #22 can be merged", "Wait for your approval", "Merge with GitHub", "Confirm the merge"],
  });
  await a.run(0, "3 approvals · checks passing");
  a.requestApproval(
    [
      { key: "repo", label: "Repository", value: REPO },
      { key: "pr", label: "Pull request", value: "#22 feat: ticket QR check-in" },
      { key: "method", label: "Merge method", value: "Squash and merge" },
    ],
    "Merge pull request",
    {
      waitingStep: 1,
      async onApprove(ctx, action) {
        await action.run(2);
        await action.run(3, "GitHub confirmed commit 3f9c2e1");
        action.finish({
          verified: true,
          summary: "Squashed into main as 3f9c2e1",
          links: [{ label: "View PR #22", href: `https://github.com/${REPO}/pull/22` }],
        });
        await ctx.say("Merged. GitHub confirmed **#22** was squashed into `main` as `3f9c2e1`.");
      },
      async onDecline(ctx) {
        await ctx.say("No problem. I haven't merged anything, and #22 is still open.");
      },
    },
  );
};

const email: Script = async (ctx, input) => {
  const name = input.match(/(?:e-?mail|mail|to)\s+([A-Z][a-z]+)/)?.[1] ?? "Tobi";
  await ctx.say(`Here's a draft for ${name}. Edit anything you like; I'll only send it once you approve.`);
  const a = ctx.action({
    app: "gmail",
    title: `Send email to ${name}`,
    steps: ["Draft the email", "Wait for your approval", "Send with Gmail", "Confirm delivery"],
  });
  await a.run(0, "Using your usual tone");
  a.requestApproval(
    [
      { key: "to", label: "To", value: `${name.toLowerCase()}@example.com`, editable: true },
      { key: "subject", label: "Subject", value: "Quick call today?", editable: true },
      {
        key: "body",
        label: "Message",
        value: `Hi ${name},\n\nDo you have 15 minutes before 2:30 today? I'd like to settle the v2 launch date before the partner review.\n\nEmmanuel`,
        editable: true,
        multiline: true,
      },
    ],
    "Send email",
    {
      waitingStep: 1,
      async onApprove(ctx, action, values) {
        await action.run(2);
        await action.run(3, "Gmail confirmed delivery");
        action.finish({ verified: true, summary: `Delivered to ${values.to}` });
        await ctx.say(`Sent. Gmail confirmed delivery to **${values.to}**.`);
      },
      async onDecline(ctx) {
        await ctx.say("Okay, nothing was sent. I've discarded the draft.");
      },
    },
  );
};

const reschedule: Script = async (ctx) => {
  await ctx.say("Thursday at 3:00 PM is free for both of you. I'll move it once you confirm.");
  const a = ctx.action({
    app: "google-calendar",
    title: "Move “Product sync with Tobi”",
    steps: ["Find a time you're both free", "Wait for your approval", "Update the event", "Confirm guests were notified"],
  });
  await a.run(0, "Thu 3:00 – 3:30 PM");
  a.requestApproval(
    [
      { key: "event", label: "Event", value: "Product sync with Tobi" },
      { key: "from", label: "From", value: "Today, 2:30 – 3:00 PM" },
      { key: "to", label: "To", value: "Thursday, 3:00 – 3:30 PM" },
      { key: "note", label: "Note to guests", value: "Moving this so we have the dashboard demo first.", editable: true },
    ],
    "Move event",
    {
      waitingStep: 1,
      async onApprove(ctx, action) {
        await action.run(2, "Google Calendar updated the event");
        action.step(3, "running");
        await ctx.wait(1100);
        action.step(3, "failed", "Google didn't return a notification status");
        action.finish({ verified: false, summary: "Event moved; guest notification not confirmed" });
        await ctx.say(
          "The event is moved to **Thursday at 3:00 PM**. Google didn't confirm that Tobi was notified, so I've marked this **unverified**. You may want to give him a heads-up.",
        );
      },
    },
  );
};

const whatsapp: Script = async (ctx) => {
  const a = ctx.action({
    app: "whatsapp",
    title: "Send “running 10 minutes late” to Ada",
    steps: ["Check WhatsApp is connected", "Send the message"],
  });
  a.step(0, "running");
  await ctx.wait(900);
  a.step(0, "failed", "Not connected");
  a.step(1, "skipped");
  a.patch({
    status: "failed",
    finishedAt: new Date().toISOString(),
    error: {
      message: "WhatsApp isn't connected, so nothing was sent.",
      cta: { label: "Connect WhatsApp", href: "/integrations" },
    },
  });
  await ctx.say("I couldn't send that: WhatsApp isn't connected yet. Connect it and ask again, and I'll send it straight away.");
};

const slack: Script = async (ctx) => {
  const a = ctx.action({
    app: "slack",
    title: "Post standup notes to #eventfi",
    steps: ["Write standup notes", "Check Slack is connected", "Post to #eventfi"],
  });
  await a.run(0);
  a.step(1, "running");
  await ctx.wait(800);
  a.step(1, "failed", "Access token expired");
  a.step(2, "skipped");
  a.patch({
    status: "failed",
    finishedAt: new Date().toISOString(),
    error: { message: "Slack revoked LANA's access, so nothing was posted.", cta: { label: "Reconnect Slack", href: "/integrations" } },
  });
  await ctx.say("Your Slack connection has expired, so I didn't post anything. The notes are ready; reconnect Slack and I'll post them.");
};

const notion: Script = async (ctx) => {
  const a = ctx.action({
    app: "notion",
    title: "Create page from meeting notes",
    steps: ["Create page “Partner sync notes”", "Add notes and action items", "Share the page with Tobi"],
  });
  await a.run(0, "In EventFi / Meetings");
  await a.run(1, "3 action items");
  a.step(2, "running");
  await ctx.wait(1000);
  a.step(2, "failed", "No permission to share in this workspace");
  a.patch({
    status: "partially_completed",
    finishedAt: new Date().toISOString(),
    summary: "Page created; sharing failed",
    links: [{ label: "Open in Notion", href: "https://www.notion.so" }],
  });
  await ctx.say(
    "I created the page and added your notes, but **I couldn't share it with Tobi**: Notion says you don't have sharing permission in that workspace. You can share it from the page yourself.",
  );
};

const task: Script = async (ctx, input) => {
  const a = ctx.action({ app: "lana", title: "Create a task", steps: ["Work out the details", "Save to your tasks"] });
  const title =
    input
      .replace(/^(please\s+)?(add|create|make)\s+(a\s+)?(new\s+)?(task|todo|to-do)\s*(to|for|:)?\s*/i, "")
      .replace(/\s+(by|due|for)\s+(today|tomorrow|friday|monday)\b.*$/i, "")
      .trim() || "Follow up with Tobi";
  const due = /tomorrow/i.test(input) ? addDays(new Date(), 1) : /today/i.test(input) ? new Date() : addDays(new Date(), 2);
  const priority = /urgent|asap/i.test(input) ? "urgent" : /important|high/i.test(input) ? "high" : "medium";
  await a.run(0, `${PRIORITY_LABELS[priority]} · due ${formatDay(due).toLowerCase()}`);
  a.step(1, "running");
  await ctx.wait(500);
  const created = createTask({
    title: title.charAt(0).toUpperCase() + title.slice(1),
    priority,
    due: toDateKey(due),
    source: { kind: "assistant", label: "Created by LANA in chat" },
  });
  a.step(1, "done", "Saved");
  a.finish({ verified: true, summary: created.title, links: [{ label: "View in Tasks", href: "/tasks" }] });
  await ctx.say(`Added **${created.title}** to your tasks, ${PRIORITY_LABELS[priority].toLowerCase()} priority, due ${formatDay(due).toLowerCase()}.`);
};

const schedule: Script = async (ctx) => {
  const a = ctx.action({
    app: "google-calendar",
    title: "Check today's schedule",
    steps: ["Read your calendars", "Find free time"],
  });
  const today = eventsOnDay(getEvents(), new Date());
  await a.run(0, plural(today.length, "event"));
  const free = freeSlots(getEvents(), new Date(), "09:00", "18:00", 45);
  await a.run(1, plural(free.length, "free block"));
  a.finish({ verified: true, summary: `${plural(today.length, "event")} today` });

  const lines = today.map((e) => `- **${e.allDay ? "All day" : formatTime(e.start)}** ${e.title}${e.location ? ` · ${e.location}` : e.videoUrl ? " · video call" : ""}`);
  const longest = free.reduce<(typeof free)[number] | undefined>(
    (best, slot) => (!best || slot.end.getTime() - slot.start.getTime() > best.end.getTime() - best.start.getTime() ? slot : best),
    undefined,
  );
  const freeText = longest
    ? `Your longest free block is **${formatTimeRange(longest.start.toISOString(), longest.end.toISOString())}**.`
    : "You don't have any free blocks longer than 45 minutes between 9 and 6.";
  await ctx.say(`You have **${plural(today.length, "event")}** today:\n\n${lines.join("\n")}\n\n${freeText}`);
};

const attention: Script = async (ctx) => {
  const a = ctx.action({
    app: "lana",
    title: "Check what needs your attention",
    steps: ["Check pending approvals", "Check overdue and due-today tasks", "Check today's calendar"],
  });
  const approvals = getActivityList().filter((x) => x.status === "awaiting_approval");
  await a.run(0, plural(approvals.length, "approval"), 500);
  const tasks = getTasks();
  const overdue = tasks.filter((t) => isOverdue(t));
  const today = tasks.filter((t) => t.status !== "done" && isDueToday(t));
  await a.run(1, `${overdue.length} overdue · ${today.length} today`, 500);
  const next = eventsOnDay(getEvents(), new Date()).find((e) => !e.allDay && new Date(e.end) > new Date());
  await a.run(2, next ? `Next: ${formatTime(next.start)}` : "Nothing else today", 500);
  a.finish({ verified: true, summary: `${approvals.length + overdue.length} items need you` });

  const parts: string[] = [];
  if (approvals.length)
    parts.push(`**${plural(approvals.length, "action")} waiting for your approval**\n\n${approvals.map((x) => `- ${x.title}`).join("\n")}`);
  if (overdue.length) parts.push(`**Overdue**\n\n${overdue.map((t) => `- ${t.title}`).join("\n")}`);
  if (today.length) parts.push(`**Due today**\n\n${today.map((t) => `- ${t.title}${t.dueTime ? ` (by ${t.dueTime})` : ""}`).join("\n")}`);
  if (next) parts.push(`Your next event is **${next.title}** at ${formatTime(next.start)}.`);
  await ctx.say(parts.join("\n\n") + "\n\nYou can review approvals in [Activity](/activity).");
};

const prepMeeting: Script = async (ctx) => {
  const next = getEvents()
    .filter((e) => !e.allDay && new Date(e.start) > new Date())
    .sort((x, y) => x.start.localeCompare(y.start))[0];
  if (!next) {
    await ctx.say("You don't have any upcoming meetings on your calendar.");
    return;
  }
  const project = getProjects().find((p) => p.id === next.projectId);
  const a = ctx.action({
    app: "google-calendar",
    title: `Prepare for “${next.title}”`,
    steps: ["Read the event", "Gather related tasks and notes", "Check recent email with attendees"],
  });
  await a.run(0, `${formatDay(next.start)}, ${formatTime(next.start)}`);
  const related = getTasks().filter((t) => t.projectId === next.projectId && t.status !== "done").slice(0, 3);
  await a.run(1, plural(related.length, "open task"));
  await a.run(2, "2 threads");
  a.finish({ verified: true, summary: "Briefing ready" });
  await ctx.say(
    `**${next.title}** · ${formatDay(next.start)}, ${formatTimeRange(next.start, next.end)}${next.attendees?.length ? ` with ${next.attendees.join(", ")}` : ""}\n\n` +
      (project ? `This is part of **${project.name}**. ${project.description}\n\n` : "") +
      (related.length ? `**Open tasks you may want to raise**\n\n${related.map((t) => `- ${t.title}`).join("\n")}\n\n` : "") +
      (next.description ? `**Agenda from the invite:** ${next.description}\n\n` : "") +
      "Want me to draft talking points or send a short agenda to the attendees?",
  );
};

const organise: Script = async (ctx) => {
  const a = ctx.action({
    app: "lana",
    title: "Plan today's tasks",
    steps: ["Read today's and overdue tasks", "Check your calendar for focus time", "Suggest an order"],
  });
  const open = getTasks().filter((t) => t.status !== "done" && (isDueToday(t) || isOverdue(t)));
  await a.run(0, plural(open.length, "task"));
  const free = freeSlots(getEvents(), new Date(), "09:00", "18:00", 30);
  await a.run(1, plural(free.length, "free block"));
  await a.run(2);
  a.finish({ verified: true, summary: "Suggested plan ready" });

  const rank = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 } as const;
  const sorted = [...open].sort((x, y) => rank[x.priority] - rank[y.priority]);
  const rows = sorted.map((t, i) => {
    const slot = free[i];
    return `| ${i + 1} | ${t.title} | ${PRIORITY_LABELS[t.priority]} | ${slot ? formatTime(slot.start) : "After 6 PM"} |`;
  });
  await ctx.say(
    `Here's a suggested order for today, fitted around your meetings:\n\n| # | Task | Priority | Start |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n\n` +
      "The overdue financial model goes first since Bisi is waiting on it. I haven't changed anything; say the word and I'll block these times on your calendar.",
  );
};

const code: Script = async (ctx) => {
  await ctx.say(
    "Here's a small script that lists open PRs with failing checks using the GitHub CLI:\n\n" +
      "```bash\n" +
      "#!/usr/bin/env bash\n" +
      "# List open PRs on EventFi whose checks are failing\n" +
      `gh pr list --repo ${REPO} --state open --json number,title,statusCheckRollup \\\n` +
      "  --jq '.[] | select(any(.statusCheckRollup[]; .conclusion == \"FAILURE\")) | \"#\\(.number) \\(.title)\"'\n" +
      "```\n\n" +
      "And the same check in TypeScript, if you'd rather run it from the EventFi repo:\n\n" +
      "```ts\n" +
      'import { Octokit } from "@octokit/rest";\n\n' +
      "const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });\n\n" +
      "export async function failingPulls(owner: string, repo: string) {\n" +
      '  const { data: pulls } = await octokit.pulls.list({ owner, repo, state: "open" });\n' +
      "  const results = await Promise.all(\n" +
      "    pulls.map(async (pr) => {\n" +
      "      const { data } = await octokit.checks.listForRef({ owner, repo, ref: pr.head.sha });\n" +
      '      const failing = data.check_runs.some((run) => run.conclusion === "failure");\n' +
      "      return failing ? `#${pr.number} ${pr.title}` : null;\n" +
      "    }),\n" +
      "  );\n" +
      "  return results.filter(Boolean);\n" +
      "}\n" +
      "```",
  );
};

const simulatedError: Script = async (ctx) => {
  await ctx.wait(600);
  ctx.fail("LANA couldn't reach the language model, so this request wasn't processed. Nothing was changed.");
};

const fallback: Script = async (ctx) => {
  await ctx.say(
    "I'm running in **preview mode**, so I can only handle a set of demo requests for now. Try one of these:\n\n" +
      "- What needs my attention?\n" +
      "- Show my open GitHub pull requests\n" +
      "- Merge PR #22\n" +
      "- Email Tobi about a quick call\n" +
      "- Move my sync with Tobi to Thursday\n" +
      "- Organise my tasks for today\n" +
      "- Prepare for my next meeting\n" +
      "- Add a task to renew the domain tomorrow\n" +
      "- Create a Notion page from my meeting notes",
  );
};

const SCENARIOS: [RegExp, Script][] = [
  [/simulate (an )?error/i, simulatedError],
  [/\bmerge\b/i, githubMerge],
  [/\b(prs?|pull requests?|github)\b/i, githubPrs],
  [/whats\s?app/i, whatsapp],
  [/\bslack\b|standup/i, slack],
  [/\b(move|reschedule|push)\b/i, reschedule],
  [/\b(e-?mail|mail)\b/i, email],
  [/\bnotion\b/i, notion],
  [/attention|catch me up|what('?s| is) (urgent|important)|summari[sz]e my day/i, attention],
  [/prepare|prep\b|next meeting/i, prepMeeting],
  [/organi[sz]e|plan (my|today)|prioriti[sz]e/i, organise],
  [/\b(script|code|regex|function)\b/i, code],
  [/\b(add|create|make)\b.*\b(task|todo|to-do)\b|\bremind me\b/i, task],
  [/\b(schedule|calendar|today|meetings?|agenda)\b/i, schedule],
];

export function pickScenario(input: string): Script {
  return SCENARIOS.find(([re]) => re.test(input))?.[1] ?? fallback;
}
