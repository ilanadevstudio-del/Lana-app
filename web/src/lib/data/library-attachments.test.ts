import { describe, expect, test } from "vitest";
import { attachmentFor, attachmentProblems } from "./library-attachments";
import type { LibraryItem } from "./types";

const cv: LibraryItem = {
  id: "cv",
  kind: "file",
  name: "CV",
  aliases: [],
  sharing: "ask",
  shares: [],
  file: { fileName: "cv.pdf", size: 188_416, mimeType: "application/pdf" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("attachmentProblems", () => {
  const att = attachmentFor(cv);

  test("no problems while the item is unchanged", () => {
    expect(attachmentProblems([att], [cv])).toEqual([]);
  });

  test("a removed item", () => {
    expect(attachmentProblems([att], [])).toEqual([{ attachment: att, reason: "removed", message: "CV was removed from your Library." }]);
  });

  test("an item switched to never share", () => {
    expect(attachmentProblems([att], [{ ...cv, sharing: "never" }])).toEqual([
      { attachment: att, reason: "never", message: "CV is now set to never share." },
    ]);
  });

  test("a file replaced after the approval was drafted", () => {
    const replaced = { ...cv, file: { ...cv.file!, fileName: "cv-v2.pdf", size: 200_000 } };
    expect(attachmentProblems([att], [replaced])).toEqual([
      { attachment: att, reason: "changed", message: "CV changed since this was drafted. Ask again to send the current file." },
    ]);
  });
});
