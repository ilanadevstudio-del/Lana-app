"use client";

import { recipientLabel } from "@/components/library/library-meta";
import { addActivityRecord } from "@/lib/data/activity";
import { getLibrary, recordShare, resolveFromLibrary } from "@/lib/data/library";
import { extractLibraryQuery, type LibraryResolution } from "@/lib/data/library-resolve";
import type { ActionField, LibraryItem } from "@/lib/data/types";
import { getUser } from "@/lib/data/workspace";
import { formatBytes } from "@/lib/format";
import type { Script } from "./engine";
import type { ApprovalAttachment, ContextRef } from "./types";

/**
 * "Send my CV to …": finds the item in the Library, drafts the email and waits for approval.
 * Never guesses between several matches, never touches never-share items, and asks for a
 * recipient instead of drafting to nobody. Sending is simulated, like every preview action.
 */

/** First email address in the request; otherwise a capitalised name after "to"; otherwise null. */
export function parseRecipient(request: string): string | null {
  const email = request.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
  if (email) return email[0].toLowerCase();
  const name = request.match(/\bto\s+([A-Z][a-z]+)\b/);
  return name ? `${name[1].toLowerCase()}@example.com` : null;
}

function attachmentFor(item: LibraryItem): ApprovalAttachment {
  const detail = item.file ? `${item.file.fileName} · ${formatBytes(item.file.size)}` : item.link ? item.link.url : "Pasted into the message";
  return { libraryItemId: item.id, kind: item.kind, name: item.name, detail };
}

function draftBody(item: LibraryItem, to: string) {
  const sender = getUser().firstName;
  const hello = `Hi ${recipientLabel(to)},`;
  if (item.kind === "text") return `${hello}\n\n${item.text!.body}\n\n${sender}`;
  if (item.kind === "link") return `${hello}\n\nHere's my ${item.name.toLowerCase()}: ${item.link!.url}\n\n${sender}`;
  return `${hello}\n\nPlease find my ${item.name.toLowerCase()} attached.\n\n${sender}`;
}

function resolveRequest(input: string, context?: ContextRef[]): { query: string; result: LibraryResolution } | null {
  const ref = context?.find((c) => c.kind === "library");
  if (ref) {
    const item = getLibrary().find((i) => i.id === ref.id);
    if (item) return { query: item.name.toLowerCase(), result: item.sharing === "never" ? { kind: "blocked", item } : { kind: "match", item } };
  }
  const query = extractLibraryQuery(input);
  return query ? { query, result: resolveFromLibrary(query) } : null;
}

export const sendFromLibrary: Script = async (ctx, input, context) => {
  const resolved = resolveRequest(input, context);
  if (!resolved) {
    await ctx.say("Which item from your [Library](/library) should I send?");
    return;
  }
  const { query, result } = resolved;
  const to = parseRecipient(input);

  if (result.kind === "match" && !to) {
    await ctx.say(`Who should I send your ${result.item.name.toLowerCase()} to? An email address works best.`);
    return;
  }

  const title = result.kind === "match" ? `Send ${result.item.name} to ${to}` : `Send “my ${query}”`;
  const a = ctx.action({
    app: "gmail",
    title,
    steps: [`Find “my ${query}” in your Library`, "Draft the email", "Wait for your approval", "Send with Gmail", "Confirm delivery"],
  });
  a.step(0, "running");
  await ctx.wait(600);

  const failRest = () => [1, 2, 3, 4].forEach((i) => a.step(i, "skipped"));
  switch (result.kind) {
    case "blocked": {
      a.step(0, "failed", "Set to never share");
      failRest();
      a.patch({ status: "cancelled", finishedAt: new Date().toISOString() });
      await ctx.say(
        `Your ${result.item.name.toLowerCase()} is set to never share, so I won't send it. You can change that in the [Library](/library), or attach it yourself.`,
      );
      return;
    }
    case "none": {
      a.step(0, "failed", "Not in your Library");
      failRest();
      a.patch({
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: { message: `There's no “${query}” in your Library, so nothing was sent.`, cta: { label: "Open Library", href: "/library" } },
      });
      await ctx.say(`I couldn't find your ${query} in your Library. [Add it to your Library](/library) and ask me again.`);
      return;
    }
    case "candidates": {
      a.step(0, "done", `${result.items.length} matches`);
      failRest();
      a.patch({ status: "cancelled", finishedAt: new Date().toISOString() });
      await ctx.say(
        `A few things in your Library match “${query}”:\n\n${result.items.map((i) => `- **${i.name}**`).join("\n")}\n\nWhich one should I send?`,
      );
      return;
    }
  }

  const item = result.item;
  a.step(0, "done", item.file?.fileName ?? item.name);
  await a.run(1);
  const fields: ActionField[] = [
    { key: "to", label: "To", value: to!, editable: true },
    { key: "subject", label: "Subject", value: `${item.name} — ${getUser().firstName} ${getUser().lastName}`, editable: true },
    { key: "body", label: "Message", value: draftBody(item, to!), editable: true, multiline: true },
  ];
  await ctx.say(`Here's the email with your ${item.name.toLowerCase()}. Check it over; I'll send it once you approve.`);
  a.requestApproval(
    fields,
    "Send email",
    {
      waitingStep: 2,
      async onApprove(ctx, action, values) {
        await action.run(3);
        await action.run(4, "Gmail confirmed delivery");
        const at = new Date().toISOString();
        recordShare(item.id, { at, to: values.to, via: "gmail", actionId: action.id });
        addActivityRecord({
          id: action.id,
          integrationId: "gmail",
          title: `Send ${item.name} to ${values.to}`,
          summary: `Delivered to ${values.to}`,
          status: "succeeded",
          steps: [
            { id: "s0", label: `Find “my ${query}” in your Library`, state: "done", detail: item.file?.fileName ?? item.name },
            { id: "s1", label: "Draft the email", state: "done" },
            { id: "s2", label: "Wait for your approval", state: "done", detail: "Approved by you" },
            { id: "s3", label: "Send with Gmail", state: "done" },
            { id: "s4", label: "Confirm delivery", state: "done", detail: "Gmail confirmed delivery" },
          ],
          fields: fields.map((f) => ({ ...f, value: values[f.key] ?? f.value })),
          createdAt: at,
          finishedAt: at,
          decidedAt: at,
          origin: { kind: "conversation", label: `Send my ${query}` },
          simulated: true,
        });
        action.finish({ verified: true, summary: `Delivered to ${values.to}` });
        await ctx.say(`Sent. Gmail confirmed delivery of your ${item.name.toLowerCase()} to **${values.to}**.`);
      },
      async onDecline(ctx) {
        await ctx.say("Okay, I didn't send anything.");
      },
    },
    [attachmentFor(item)],
  );
};

/** Requests this scenario handles: "send/email/share my X", or any send request with a Library item attached via "@". */
export function isLibraryRequest(input: string, context?: ContextRef[]) {
  if (context?.some((c) => c.kind === "library") && /\b(send|email|mail|share|forward|attach)\b/i.test(input)) return true;
  return /\b(send|email|mail|share|forward)\b.*\bmy\b/i.test(input);
}
