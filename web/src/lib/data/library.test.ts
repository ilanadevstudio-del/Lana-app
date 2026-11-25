import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createLibraryItem,
  deleteLibraryItem,
  getLibrary,
  recordShare,
  replaceLibraryFile,
  resolveFromLibrary,
  restoreLibraryItem,
} from "./library";

const revoke = vi.fn();

beforeEach(() => {
  revoke.mockClear();
  vi.stubGlobal("URL", Object.assign(URL, { revokeObjectURL: revoke }));
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const pdf = (name: string, size: number, url: string) => ({ fileName: name, size, mimeType: "application/pdf", previewUrl: url });

describe("library store", () => {
  test("replace keeps the old file as the newest version and revokes its preview", () => {
    const item = createLibraryItem({ kind: "file", name: "Deck", aliases: [], sharing: "ask", file: pdf("a.pdf", 10, "blob:a") });
    replaceLibraryFile(item.id, pdf("b.pdf", 20, "blob:b"));
    const now = getLibrary().find((i) => i.id === item.id)!;
    expect(now.file!.fileName).toBe("b.pdf");
    expect(now.versions![0]).toMatchObject({ fileName: "a.pdf", size: 10 });
    expect(revoke).toHaveBeenCalledWith("blob:a");
  });

  test("delete then restore within the undo window keeps the preview usable", () => {
    const item = createLibraryItem({ kind: "file", name: "Tmp", aliases: [], sharing: "ask", file: pdf("t.pdf", 1, "blob:t") });
    const removed = deleteLibraryItem(item.id)!;
    expect(getLibrary().some((i) => i.id === item.id)).toBe(false);
    restoreLibraryItem(removed);
    vi.advanceTimersByTime(8000);
    expect(revoke).not.toHaveBeenCalledWith("blob:t");
    expect(getLibrary().some((i) => i.id === item.id)).toBe(true);
  });

  test("delete without restore revokes the preview after the undo window", () => {
    const item = createLibraryItem({ kind: "file", name: "Gone", aliases: [], sharing: "ask", file: pdf("g.pdf", 1, "blob:g") });
    deleteLibraryItem(item.id);
    expect(revoke).not.toHaveBeenCalledWith("blob:g");
    vi.advanceTimersByTime(8000);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith("blob:g");
  });

  test("recordShare puts the newest share first", () => {
    const cv = getLibrary().find((i) => i.name === "CV")!;
    recordShare(cv.id, { at: new Date().toISOString(), to: "tobi@example.com", via: "gmail" });
    expect(getLibrary().find((i) => i.id === cv.id)!.shares[0].to).toBe("tobi@example.com");
  });

  test("resolveFromLibrary finds the CV by alias", () => {
    expect(resolveFromLibrary("resume")).toMatchObject({ kind: "match", item: { name: "CV" } });
  });
});

describe("sample library", () => {
  test("has the eight items from the spec", () => {
    const names = getLibrary()
      .filter((i) => !["Deck", "Tmp", "Gone"].includes(i.name))
      .map((i) => i.name);
    expect(names).toEqual(
      expect.arrayContaining(["CV", "Headshot", "Portfolio", "LinkedIn", "Short bio", "Mailing address", "EventFi pitch deck", "Passport scan"]),
    );
  });

  test("has exactly one never-share item, the passport", () => {
    const never = getLibrary().filter((i) => i.sharing === "never");
    expect(never.map((i) => i.name)).toEqual(["Passport scan"]);
  });

  test("the headshot has no preview image", () => {
    expect(getLibrary().find((i) => i.name === "Headshot")!.file!.previewUrl).toBeUndefined();
  });
});
