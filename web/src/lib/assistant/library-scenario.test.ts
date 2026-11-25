import { afterEach, describe, expect, test, vi } from "vitest";
import { getActivityList } from "@/lib/data/activity";
import { deleteLibraryItem, getLibrary, replaceLibraryFile, updateLibraryItem } from "@/lib/data/library";
import type { ActionField } from "@/lib/data/types";
import { approvalBlockReason, approve, startConversation, type ActionHandle, type PendingApproval, type ScriptContext } from "./engine";
import { parseRecipient, sendFromLibrary } from "./library-scenario";
import { pickScenario } from "./scenarios";
import { findConversation } from "./store";
import type { ApprovalAttachment } from "./types";

interface FakeAction {
  title: string;
  steps: [number, string, string?][];
  patches: Record<string, unknown>[];
  approval?: { fields: ActionField[]; label: string; pending: PendingApproval; attachments?: ApprovalAttachment[] };
}

function fakeContext() {
  const said: string[] = [];
  const actions: FakeAction[] = [];
  const ctx: ScriptContext = {
    say: async (t) => void said.push(t),
    wait: async () => {},
    phase: () => {},
    fail: (m) => {
      throw new Error(m);
    },
    action: ({ title }) => {
      const rec: FakeAction = { title, steps: [], patches: [] };
      actions.push(rec);
      const handle: ActionHandle = {
        id: `act_${actions.length}`,
        patch: (p) => void rec.patches.push(p),
        step: (i, s, d) => void rec.steps.push([i, s, d]),
        run: async (i, d) => void rec.steps.push([i, "done", d]),
        requestApproval: (fields, label, pending, attachments) => void (rec.approval = { fields, label, pending, attachments }),
        finish: (o) => void rec.patches.push({ finished: o }),
      };
      return handle;
    },
  };
  return { ctx, said, actions };
}

describe("parseRecipient", () => {
  test("an email address", () => expect(parseRecipient("send my cv to xxx@gmail.com")).toBe("xxx@gmail.com"));
  test("a name after 'to'", () => expect(parseRecipient("send my bio to Kemi")).toBe("kemi@example.com"));
  test("nobody", () => expect(parseRecipient("send my cv")).toBeNull());
});

describe("sendFromLibrary", () => {
  test("never-share items are refused before any approval", async () => {
    const { ctx, actions, said } = fakeContext();
    await sendFromLibrary(ctx, "send my passport to a@b.com");
    expect(actions[0].approval).toBeUndefined();
    expect(actions[0].steps).toContainEqual([0, "failed", "Set to never share"]);
    expect(said.join(" ")).toMatch(/never share/i);
  });

  test("an item that isn't in the Library fails and offers to add it", async () => {
    const { ctx, actions, said } = fakeContext();
    await sendFromLibrary(ctx, "send my cover letter to a@b.com");
    expect(actions[0].patches).toContainEqual(expect.objectContaining({ status: "failed" }));
    expect(said.join(" ")).toContain("/library");
  });

  test("without a recipient LANA asks and creates no action", async () => {
    const { ctx, actions, said } = fakeContext();
    await sendFromLibrary(ctx, "send my cv");
    expect(actions).toHaveLength(0);
    expect(said.join(" ")).toMatch(/who should i send/i);
  });

  test("a match goes to approval with the item attached", async () => {
    const { ctx, actions } = fakeContext();
    await sendFromLibrary(ctx, "send my cv to a@b.com");
    const cv = getLibrary().find((i) => i.name === "CV")!;
    expect(actions[0].approval?.attachments).toEqual([expect.objectContaining({ libraryItemId: cv.id, kind: "file" })]);
    expect(actions[0].approval?.fields.find((f) => f.key === "to")?.value).toBe("a@b.com");
  });

  test("text snippets are pasted into the message", async () => {
    const { ctx, actions } = fakeContext();
    await sendFromLibrary(ctx, "send my bio to a@b.com");
    const body = actions[0].approval?.fields.find((f) => f.key === "body")?.value ?? "";
    expect(body).toContain("product engineer in Lagos");
  });
});

describe("approving after the item was removed", () => {
  afterEach(() => vi.useRealTimers());

  test("cancels instead of sending", async () => {
    vi.useFakeTimers();
    const convId = startConversation({ text: "send my deck to a@b.com" });
    await vi.runAllTimersAsync();
    const conv = findConversation(convId)!;
    const msg = conv.messages[conv.messages.length - 1];
    const part = msg.parts.find((p) => p.type === "action");
    if (part?.type !== "action") throw new Error("no action");
    expect(part.action.status).toBe("awaiting_approval");

    const before = getActivityList().length;
    deleteLibraryItem("lib_deck");
    const approving = approve(convId, msg.id, part.action.id, part.action.approval!.fields);
    await vi.runAllTimersAsync();
    await approving;

    const after = findConversation(convId)!.messages.at(-1)!.parts.find((p) => p.type === "action");
    expect(after?.type === "action" && after.action.status).toBe("cancelled");
    expect(getActivityList().length).toBe(before);
  });
});

describe("approval guard (review fixes)", () => {
  afterEach(() => vi.useRealTimers());

  async function pendingApproval(text: string) {
    vi.useFakeTimers();
    const convId = startConversation({ text });
    await vi.runAllTimersAsync();
    const msg = findConversation(convId)!.messages.at(-1)!;
    const part = msg.parts.find((p) => p.type === "action");
    if (part?.type !== "action") throw new Error("no action");
    return { convId, msg, action: part.action };
  }

  async function approveNow(convId: string, msgId: string, actionId: string, fields: ActionField[]) {
    const approving = approve(convId, msgId, actionId, fields);
    await vi.runAllTimersAsync();
    await approving;
    const part = findConversation(convId)!.messages.find((m) => m.id === msgId)!.parts.find((p) => p.type === "action");
    return part?.type === "action" ? part.action : undefined;
  }

  test("an item switched to never share while pending is not sent", async () => {
    const { convId, msg, action } = await pendingApproval("send my portfolio to a@b.com");
    const before = getLibrary().find((i) => i.id === "lib_portfolio")!.shares.length;
    updateLibraryItem("lib_portfolio", { sharing: "never" });
    const after = await approveNow(convId, msg.id, action.id, action.approval!.fields);
    expect(after?.status).toBe("cancelled");
    expect(getLibrary().find((i) => i.id === "lib_portfolio")!.shares.length).toBe(before);
  });

  test("a file replaced while pending is not sent", async () => {
    const { convId, msg, action } = await pendingApproval("send my headshot to a@b.com");
    replaceLibraryFile("lib_headshot", { fileName: "new.jpg", size: 10, mimeType: "image/jpeg" });
    const after = await approveNow(convId, msg.id, action.id, action.approval!.fields);
    expect(after?.status).toBe("cancelled");
  });

  test("the card explains why it can't be approved", async () => {
    const { action } = await pendingApproval("send my linkedin to a@b.com");
    updateLibraryItem("lib_linkedin", { sharing: "never" });
    expect(approvalBlockReason(action)).toBe("LinkedIn is now set to never share.");
  });
});

describe("routing (review fixes)", () => {
  test("ordinary messages mentioning 'my' don't go to the Library", () => {
    expect(pickScenario("Email Tobi about my availability")).not.toBe(sendFromLibrary);
    expect(pickScenario("Send a Slack message to my team")).not.toBe(sendFromLibrary);
  });

  test("Library requests still go to the Library, found or not", () => {
    expect(pickScenario("send my CV to a@b.com")).toBe(sendFromLibrary);
    expect(pickScenario("send my cover letter to a@b.com")).toBe(sendFromLibrary);
  });
});
