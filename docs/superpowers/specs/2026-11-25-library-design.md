# Library — design

Status: proposed · 2026-11-25 · UI only (preview data layer), no backend

## Intent

A place for things the user shares again and again (their CV, a headshot, a portfolio link, a short bio), so requests like "Send my CV to xxx@gmail.com" can find the right item and attach or paste it, instead of the user uploading or retyping it each time.

The Library holds **files, links and text snippets**. It is distinct from Memory: Memory is *facts LANA knows about you*; the Library is *things LANA hands out on your behalf*.

## Goals

- Add, rename, replace, delete and preview files, links and text snippets.
- Give each item names LANA can recognise ("CV", also known as "resume"), so a request resolves to exactly one item.
- Let the user mark an item as never shareable (e.g. a passport scan).
- Show where each item has been shared, so the user can see what went out and to whom.
- Demonstrate the reason for the Library end to end in the preview: "send my CV to …" resolves the item and the approval card shows exactly what will be attached.

## Non-goals (this round)

- Real storage, persistence across reloads, or real sending. Same preview data layer as every other section; uploads live in browser memory for the session.
- Folders, collections, tags beyond "also known as" names.
- Public share links.
- Saving a chat attachment into the Library (good follow-up; noted for later).

## Anti-goals

- LANA silently attaching the wrong item. Ambiguity must be asked about, never guessed.
- A "never share" item ever appearing on an approval card.
- An approval card that doesn't show exactly which file, link or text will be sent.

## Approaches considered

1. **Follow the existing section pattern (chosen).** `/library` route, `lib/data/library.ts` store over `lib/mock` sample items, docked detail panel, shared dialogs/filters/empty states, plus one assistant scenario.
2. Persist uploads in IndexedDB so they survive reloads. Rejected: real storage arrives with auth next; this would be thrown away.
3. A tab inside Memory. Rejected: blurs facts vs. things-to-send, which is the reason the Library exists.

## Design

### Item model (`lib/data/types.ts`)

```ts
type LibraryItemKind = "file" | "link" | "text";

interface LibraryItem {
  id: string;
  kind: LibraryItemKind;
  name: string;              // how it's shown and the primary way LANA refers to it: "CV"
  aliases: string[];         // other names that resolve to it: ["resume", "curriculum vitae"]
  description?: string;
  file?: { fileName: string; size: number; mimeType: string; previewUrl?: string }; // previewUrl = object URL for uploads
  link?: { url: string };
  text?: { body: string };
  sharing: "ask" | "never";  // every share needs approval anyway; "never" = LANA won't use it in any action
  versions?: { id: string; fileName: string; size: number; replacedAt: string }[]; // files only, newest first
  shares: { at: string; to: string; via: IntegrationId }[]; // usage history
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Sample items: CV (PDF, one earlier version, shared twice), Headshot (image; neutral placeholder preview, no photo of a person), Portfolio (link), LinkedIn (link), Short bio (text), Mailing address (text), EventFi pitch deck (PDF), Passport scan (file, `sharing: "never"`).

### Screen

```
Library  8 items                                   [Search library] [+ Add ▾]
[All 8] [Files 4] [Links 2] [Text 2]
─────────────────────────────────────────────────────────────────────────────
 ▣ CV               Emmanuel_Ola_CV_2026.pdf · 184 KB     Shared 2× · Kemi, 2d ago   ⋯
 ▣ Headshot         headshot.jpg · 1.2 MB                 Never shared               ⋯
 ⛓ Portfolio        emmanuelola.dev                       Shared 1×                  ⋯
 ¶ Short bio        "Founder building LANA and EventFi…"  Shared 3×                  ⋯
 🔒 Passport scan   passport.pdf · 640 KB                 Never shared automatically ⋯
```

- A list, like Memory, so it scales; image files show a small thumbnail, other files a type tile (PDF, DOC, IMG).
- Kind filter (All / Files / Links / Text) with counts, plus search across name, aliases, file name and text.
- **Add ▾** menu: Upload file, Add link, Add text. Dropping files anywhere on the page also starts an upload.
- Empty state explains the point: "Add your CV, a headshot or a bio, then ask LANA to send it."
- Row menu: Rename, Replace file (files), Copy (links/text), Pin, Delete (confirm, then undo toast).

**Detail panel** (docks on the right like Tasks; a sheet on smaller screens):
- Preview: image or PDF for files uploaded this session; type tile with a "Preview available after upload" note for sample files; the URL for links; the full text for snippets.
- Name and **"LANA knows this as"** alias chips (add/remove).
- Sharing: "Ask me each time" vs "Never share" (with one line explaining each).
- Versions (files): current plus earlier ones, with dates.
- Shared history: who, when, through which app, linking to the activity record.
- Actions: Replace, Download (session uploads only), Copy, Delete.

**Add dialog** (one dialog, adapts to kind): name (prefilled from the file name or page), also-known-as, sharing, then the file / URL / text field. Validation: name required, URL must parse, text not empty, files up to 10 MB.

### Navigation

Sidebar Workspace group: Integrations, Activity, Memory, **Library**. Shortcut `G` then `L`. Library items appear in the command menu search.

### Assistant

**Resolution:** a request mentioning "my X" is matched case-insensitively against each item's name and aliases. Exactly one match → use it. Several → LANA lists them and asks which. None → LANA says so and offers "Add to Library". A `never` item → LANA explains it's set to never share and doesn't proceed.

**Demo scenario** "send my CV to xxx@gmail.com":

1. Find "my CV" in your Library → `Emmanuel_Ola_CV_2026.pdf`
2. Draft the email
3. Wait for your approval
4. Send with Gmail
5. Confirm delivery

The approval card gains an **Attachments** row listing each item (type tile, file name, size, link to it in the Library). On approval (simulated) the item's share history and the activity record update, both marked Simulated. Variants covered: "send my bio" (text pasted into the message body, shown in full on the card), "send my passport" (refused), "send my cover letter" (not found, offer to add).

The composer's `@` picker gets a **Library** group, so users can attach an item explicitly.

### Data layer

`lib/data/library.ts`: `useLibrary`, `createLibraryItem`, `updateLibraryItem`, `replaceLibraryFile` (pushes the old file into `versions`), `deleteLibraryItem` / `restoreLibraryItem`, `recordShare`, and `resolveLibraryItem(query)` returning `{ match } | { candidates } | { none } | { blocked }`. Uploads create object URLs that are revoked on delete/replace.

## Left to the builder

Exact icons and tile treatment per file type; alias matching details (plurals, "résumé" accents); copy for empty/error states; where the Library entry sits within the palette results.
