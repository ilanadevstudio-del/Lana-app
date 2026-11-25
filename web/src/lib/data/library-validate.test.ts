import { describe, expect, test } from "vitest";
import type { LibraryItem } from "./types";
import { normalizeUrl, validateLibraryDraft } from "./library-validate";

const cvFixture: LibraryItem = {
  id: "cv",
  kind: "file",
  name: "CV",
  aliases: ["resume"],
  sharing: "ask",
  shares: [],
  file: { fileName: "cv.pdf", size: 1, mimeType: "application/pdf" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const file = { name: "cv.pdf", size: 1000, type: "application/pdf" };

describe("normalizeUrl", () => {
  test("adds https to a bare domain", () => expect(normalizeUrl("emmanuelola.dev")).toBe("https://emmanuelola.dev"));
  test("keeps an explicit protocol", () => expect(normalizeUrl("http://x.com/a")).toBe("http://x.com/a"));
  test("trims whitespace", () => expect(normalizeUrl("  x.com  ")).toBe("https://x.com"));
  test("rejects text that isn't a link", () => expect(normalizeUrl("not a url")).toBeNull());
  test("rejects a word without a dot", () => expect(normalizeUrl("localhost")).toBeNull());
});

describe("validateLibraryDraft", () => {
  test("requires a name and a valid link", () => {
    expect(validateLibraryDraft({ kind: "link", name: "", aliases: [], sharing: "ask", url: "x" }, []).errors).toMatchObject({
      name: "Give it a name.",
      url: "Enter a valid link.",
    });
  });

  test("requires text for snippets", () => {
    expect(validateLibraryDraft({ kind: "text", name: "Bio", aliases: [], sharing: "ask", text: "  " }, []).errors.text).toBe("Add the text to share.");
  });

  test("requires a file for new file items", () => {
    expect(validateLibraryDraft({ kind: "file", name: "Deck", aliases: [], sharing: "ask" }, []).errors.file).toBe("Choose a file.");
  });

  test("rejects files over 10 MB", () => {
    const big = { name: "a.zip", size: 10 * 1024 * 1024 + 1, type: "" };
    expect(validateLibraryDraft({ kind: "file", name: "Big", aliases: [], sharing: "ask", file: big }, []).errors.file).toBe("Files can be up to 10 MB.");
  });

  test("a valid draft has no errors", () => {
    expect(validateLibraryDraft({ kind: "file", name: "Deck", aliases: [], sharing: "ask", file }, []).errors).toEqual({});
  });

  test("warns when a name is already used by another item", () => {
    expect(validateLibraryDraft({ kind: "text", name: "Resume", aliases: [], sharing: "ask", text: "x" }, [cvFixture]).aliasConflicts).toEqual([
      { alias: "Resume", itemName: "CV" },
    ]);
  });

  test("an item doesn't conflict with itself when edited", () => {
    expect(validateLibraryDraft({ kind: "file", name: "CV", aliases: ["resume"], sharing: "ask", file }, [cvFixture], cvFixture.id).aliasConflicts).toEqual([]);
  });

  test("editing a file item doesn't require a new file", () => {
    expect(validateLibraryDraft({ kind: "file", name: "CV", aliases: [], sharing: "ask" }, [cvFixture], cvFixture.id).errors).toEqual({});
  });
});
