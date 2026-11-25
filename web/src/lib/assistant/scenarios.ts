import type { Script } from "./engine";

/**
 * Scripted demo scenarios, one per lifecycle outcome.
 * Matching is keyword-based. The real engine uses the LLM's tool selection instead.
 */

const githubPrs: Script = async (ctx) => {
  await ctx.say("On it. Let me check EventFi on GitHub.");
  const a = ctx.action({
    app: "github",
    title: "Summarise open PRs on EventFi",
    steps: ["Check GitHub is connected", "Find the EventFi repository", "Fetch open pull requests", "Summarise the results"],
  });
  await a.run(0, "Connected");
  await a.run(1, "ilanadevstudio-del/eventfi");
  await a.run(2, "4 open");
  await a.run(3);
  a.patch({
    state: "completed",
    links: [{ label: "Open pull requests", href: "https://github.com/ilanadevstudio-del/eventfi/pulls" }],
  });
  ctx.orb("completed");
  await ctx.say(
    "There are **4 open PRs** on EventFi:\n\n" +
      "- [#22 feat: ticket QR check-in](https://github.com/ilanadevstudio-del/eventfi/pull/22): 3 approvals, checks passing. Ready to merge.\n" +
      "- [#21 fix: timezone on event reminders](https://github.com/ilanadevstudio-del/eventfi/pull/21): waiting on a review from Tobi.\n" +
      "- [#19 chore: upgrade to Next 16](https://github.com/ilanadevstudio-del/eventfi/pull/19): 2 failing checks.\n" +
      "- [#17 feat: sponsor dashboard](https://github.com/ilanadevstudio-del/eventfi/pull/17): still a draft, last updated 6 days ago.\n\n" +
      "Want me to merge **#22**?",
  );
};

const githubMerge: Script = async (ctx) => {
  await ctx.say("Merging changes the repository, so I need your approval first.");
  const a = ctx.action({
    app: "github",
    title: "Merge PR #22 on EventFi",
    steps: ["Check PR #22 can be merged", "Wait for your approval", "Merge with GitHub", "Confirm the merge"],
  });
  await a.run(0, "3 approvals · checks passing");
  a.requestApproval(
    [
      { key: "repo", label: "Repository", value: "ilanadevstudio-del/eventfi" },
      { key: "pr", label: "Pull request", value: "#22 feat: ticket QR check-in" },
      { key: "method", label: "Method", value: "Squash and merge" },
    ],
    {
      waitingStep: 1,
      async onApprove(ctx, action) {
        await action.run(2);
        await action.run(3, "GitHub confirmed · 3f9c2e1");
        action.patch({
          state: "completed",
          links: [{ label: "View PR #22", href: "https://github.com/ilanadevstudio-del/eventfi/pull/22" }],
        });
        ctx.orb("completed");
        await ctx.say("Merged. GitHub confirmed **#22** was squashed into `main` as commit `3f9c2e1`.");
      },
      async onDecline(ctx) {
        await ctx.say("No problem. I haven't merged anything. PR #22 is still open.");
      },
    },
  );
};

const email: Script = async (ctx, input) => {
  const name = input.match(/(?:e-?mail|mail)\s+([A-Z][a-z]+)/i)?.[1] ?? "Tobi";
  const person = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  await ctx.say(`Here's a draft for ${person}. I'll send it once you approve.`);
  const a = ctx.action({
    app: "gmail",
    title: `Send email to ${person}`,
    steps: ["Draft the email", "Wait for your approval", "Send with Gmail", "Confirm delivery"],
  });
  await a.run(0);
  a.requestApproval(
    [
      { key: "to", label: "To", value: `${person.toLowerCase()}@example.com`, editable: true },
      { key: "subject", label: "Subject", value: "Quick call today?", editable: true },
      {
        key: "body",
        label: "Message",
        value: `Hi ${person},\n\nCan we have a quick call by 2:30 today?\n\nThanks!`,
        editable: true,
        multiline: true,
      },
    ],
    {
      waitingStep: 1,
      async onApprove(ctx, action, values) {
        await action.run(2);
        await action.run(3, "Gmail confirmed delivery");
        action.patch({ state: "completed" });
        ctx.orb("completed");
        await ctx.say(`Sent. Gmail confirmed delivery to **${values.to}**.`);
      },
      async onDecline(ctx) {
        await ctx.say("Okay, I didn't send anything. The draft is gone.");
      },
    },
  );
};

const whatsapp: Script = async (ctx) => {
  await ctx.say("I'll send that on WhatsApp.");
  const a = ctx.action({
    app: "whatsapp",
    title: "Send “running late” to Ada",
    steps: ["Check WhatsApp is connected", "Send the message"],
  });
  a.step(0, "running");
  await ctx.wait(900);
  a.step(0, "failed", "Not connected");
  a.patch({
    state: "failed",
    error: {
      message: "WhatsApp isn't connected, so nothing was sent.",
      cta: { label: "Connect WhatsApp", href: "/integrations" },
    },
  });
  ctx.orb("failed");
  await ctx.say("Connect WhatsApp and ask me again. I'll send it straight away.");
};

const notion: Script = async (ctx) => {
  await ctx.say("Creating that in Notion now.");
  const a = ctx.action({
    app: "notion",
    title: "Create page from meeting notes",
    steps: ["Check Notion is connected", "Create page “Meeting notes”", "Add notes and action items", "Share the page with Tobi"],
  });
  await a.run(0, "Connected");
  await a.run(1, "In Personal / Meetings");
  await a.run(2, "3 action items");
  a.step(3, "running");
  await ctx.wait(1000);
  a.step(3, "failed", "Notion: no permission to share in this workspace");
  a.patch({
    state: "partially_completed",
    links: [{ label: "Open page in Notion", href: "https://www.notion.so" }],
  });
  ctx.orb("partially_completed");
  await ctx.say(
    "I created the page and added your notes, but **I couldn't share it with Tobi**. Notion says you don't have sharing permission in that workspace. You can share it from the page yourself.",
  );
};

const reminder: Script = async (ctx) => {
  const a = ctx.action({ app: "lana", title: "Create a reminder", steps: ["Work out when", "Save reminder"] });
  await a.run(0, "Tomorrow, 9:00 AM");
  await a.run(1);
  a.patch({ state: "completed" });
  ctx.orb("completed");
  await ctx.say("Done. I'll remind you **tomorrow at 9:00 AM**.");
};

const task: Script = async (ctx) => {
  const a = ctx.action({ app: "lana", title: "Create a task", steps: ["Work out the details", "Save task"] });
  await a.run(0, "High priority · due Friday");
  await a.run(1);
  a.patch({ state: "completed" });
  ctx.orb("completed");
  await ctx.say("Added to your tasks: **high priority, due Friday**.");
};

const calendar: Script = async (ctx) => {
  const a = ctx.action({
    app: "google-calendar",
    title: "Check today's calendar",
    steps: ["Check Google Calendar is connected", "Fetch today's events"],
  });
  await a.run(0, "Connected");
  await a.run(1, "2 events");
  a.patch({ state: "completed" });
  ctx.orb("completed");
  await ctx.say(
    "You have **2 events** today:\n\n- **2:30 PM:** Product sync with Tobi (video call)\n- **4:00 PM:** EventFi partner review in Yaba\n\nYou're free until 2:30 if you need focus time.",
  );
};

const fallback: Script = async (ctx) => {
  await ctx.say(
    "I'm running in **demo mode**, so I can't answer that properly yet. Try asking me to:\n\n" +
      "- Summarise the open PRs on EventFi\n" +
      "- Merge PR #22\n" +
      "- Email Tobi about a call\n" +
      "- Send a WhatsApp message\n" +
      "- Create a Notion page from meeting notes\n" +
      "- Set a reminder or create a task\n" +
      "- Check what's on today",
  );
};

const SCENARIOS: [RegExp, Script][] = [
  [/\bmerge\b/i, githubMerge],
  [/\b(prs?|pull requests?|github)\b/i, githubPrs],
  [/whats\s?app/i, whatsapp],
  [/\b(e-?mail|mail)\b/i, email],
  [/\bnotion\b/i, notion],
  [/\bremind/i, reminder],
  [/\btask\b/i, task],
  [/\b(schedul\w*|calendar|today|meetings?)\b/i, calendar],
];

export function pickScenario(input: string): Script {
  return SCENARIOS.find(([re]) => re.test(input))?.[1] ?? fallback;
}
