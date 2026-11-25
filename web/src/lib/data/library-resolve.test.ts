import { describe, expect, test } from "vitest";
import { extractLibraryQuery, normalizeName, resolveLibraryItem } from "./library-resolve";
import type { LibraryItem } from "./types";

const base = { aliases: [], sharing: "ask" as const, shares: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

const cv: LibraryItem = {
  ...base,
  id: "cv",
  kind: "file",
  name: "CV",
  aliases: ["resume"],
  file: { fileName: "cv.pdf", size: 100, mimeType: "application/pdf" },
};
const bio: LibraryItem = { ...base, id: "bio", kind: "text", name: "Short bio", aliases: ["bio"], text: { body: "Hi" } };
const passport: LibraryItem = {
  ...base,
  id: "passport",
  kind: "file",
  name: "Passport scan",
  aliases: ["passport"],
  sharing: "never",
  file: { fileName: "passport.pdf", size: 100, mimeType: "application/pdf" },
};
const headshot: LibraryItem = {
  ...base,
  id: "headshot",
  kind: "file",
  name: "Headshot",
  file: { fileName: "headshot.jpg", size: 100, mimeType: "image/jpeg" },
};
const items = [cv, bio, passport, headshot];

describe("resolveLibraryItem", () => {
  test("matches by name, case-insensitively", () => {
    expect(resolveLibraryItem(items, "cv")).toMatchObject({ kind: "match", item: { name: "CV" } });
  });

  test("matches an alias with accents stripped", () => {
    expect(resolveLibraryItem(items, "Résumé")).toMatchObject({ kind: "match", item: { name: "CV" } });
  });

  test("blocks a never-share item", () => {
    expect(resolveLibraryItem(items, "passport")).toMatchObject({ kind: "blocked", item: { id: "passport" } });
  });

  test("reports no match with the query", () => {
    expect(resolveLibraryItem(items, "cover letter")).toEqual({ kind: "none", query: "cover letter" });
  });

  test("returns candidates instead of guessing when names collide", () => {
    const oldCv: LibraryItem = { ...cv, id: "cv2", name: "Old CV", aliases: ["cv"] };
    const result = resolveLibraryItem([...items, oldCv], "cv");
    expect(result.kind).toBe("candidates");
    expect(result.kind === "candidates" && result.items.map((i) => i.id).sort()).toEqual(["cv", "cv2"]);
  });
});

describe("extractLibraryQuery", () => {
  test("takes the phrase after 'my' up to 'to'", () => {
    expect(extractLibraryQuery("Send my CV to tobi@example.com")).toBe("cv");
  });

  test("keeps multi-word names", () => {
    expect(extractLibraryQuery("send my short bio to Kemi")).toBe("short bio");
  });

  test("returns null without 'my'", () => {
    expect(extractLibraryQuery("what's on today")).toBeNull();
  });
});

describe("normalizeName", () => {
  test("lowercases, strips accents and collapses spaces", () => {
    expect(normalizeName("  Résumé   File ")).toBe("resume file");
  });

  test("drops a plural s on single longer words", () => {
    expect(normalizeName("photos")).toBe("photo");
    expect(normalizeName("cvs")).toBe("cvs");
  });
});
