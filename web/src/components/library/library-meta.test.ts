import { describe, expect, test } from "vitest";
import type { LibraryItem } from "@/lib/data/types";
import { itemPhrase, previewMode, recipientLabel, secondaryLine, shareSummary } from "./library-meta";

const NOW = new Date("2026-11-25T12:00:00Z");
const item = (patch: Partial<LibraryItem>): LibraryItem => ({
  id: "x",
  kind: "file",
  name: "CV",
  aliases: [],
  sharing: "ask",
  shares: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...patch,
});

describe("shareSummary", () => {
  test("never-share items say so", () => {
    expect(shareSummary(item({ sharing: "never" }), NOW)).toBe("Never shared automatically");
  });

  test("items without shares", () => {
    expect(shareSummary(item({}), NOW)).toBe("Never shared");
  });

  test("count, last recipient and age", () => {
    const shares = [
      { at: "2026-11-23T12:00:00Z", to: "kemi.bello@example.com", via: "gmail" as const },
      { at: "2026-11-10T12:00:00Z", to: "a@b.com", via: "gmail" as const },
    ];
    expect(shareSummary(item({ shares }), NOW)).toBe("Shared 2× · Kemi, 2d ago");
  });

  test("recent shares use hours", () => {
    const shares = [{ at: "2026-11-25T09:00:00Z", to: "#general", via: "slack" as const }];
    expect(shareSummary(item({ shares }), NOW)).toBe("Shared 1× · #general, 3h ago");
  });
});

describe("recipientLabel", () => {
  test("first name from an email", () => expect(recipientLabel("kemi.bello@example.com")).toBe("Kemi"));
  test("channels stay as they are", () => expect(recipientLabel("#general")).toBe("#general"));
});

describe("secondaryLine", () => {
  test("files show name and size", () => {
    expect(secondaryLine(item({ file: { fileName: "cv.pdf", size: 188_416, mimeType: "application/pdf" } }))).toBe("cv.pdf · 184 KB");
  });

  test("links drop the protocol and trailing slash", () => {
    expect(secondaryLine(item({ kind: "link", link: { url: "https://emmanuelola.dev/" } }))).toBe("emmanuelola.dev");
  });

  test("text is flattened and cut at 80 characters", () => {
    const body = "Line one\nline two " + "x".repeat(100);
    const line = secondaryLine(item({ kind: "text", text: { body } }));
    expect(line.startsWith("Line one line two ")).toBe(true);
    expect(line.length).toBe(81);
    expect(line.endsWith("…")).toBe(true);
  });
});

describe("previewMode", () => {
  const f = (mimeType: string, previewUrl?: string) => item({ file: { fileName: "x", size: 1, mimeType, previewUrl } });
  test("uploaded images preview as images", () => expect(previewMode(f("image/png", "blob:1"))).toBe("image"));
  test("uploaded PDFs preview in a frame", () => expect(previewMode(f("application/pdf", "blob:2"))).toBe("pdf"));
  test("uploaded Word documents get a tile", () =>
    expect(previewMode(f("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "blob:3"))).toBe("unsupported"));
  test("sample files without a binary get a tile", () => expect(previewMode(f("application/pdf"))).toBe("sample"));
  test("links and text", () => {
    expect(previewMode(item({ kind: "link", link: { url: "https://a.b" } }))).toBe("link");
    expect(previewMode(item({ kind: "text", text: { body: "x" } }))).toBe("text");
  });
});

describe("itemPhrase", () => {
  test("keeps acronyms and brand casing", () => {
    expect(itemPhrase("CV")).toBe("CV");
    expect(itemPhrase("EventFi pitch deck")).toBe("EventFi pitch deck");
    expect(itemPhrase("LinkedIn")).toBe("LinkedIn");
  });
  test("lowercases ordinary capitalised words", () => {
    expect(itemPhrase("Short bio")).toBe("short bio");
    expect(itemPhrase("Passport scan")).toBe("passport scan");
  });
});
