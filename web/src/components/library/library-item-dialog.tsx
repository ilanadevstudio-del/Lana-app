"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { createLibraryItem, getLibrary, replaceLibraryFile, updateLibraryItem } from "@/lib/data/library";
import { normalizeUrl, validateLibraryDraft, type LibraryDraft } from "@/lib/data/library-validate";
import type { LibraryItem, LibraryItemKind } from "@/lib/data/types";
import { formatBytes } from "@/lib/format";
import type { LibraryDialogState } from "./library-view";

const TITLES: Record<LibraryItemKind, string> = { file: "Upload a file", link: "Add a link", text: "Add text" };

export const SHARING_HINT = {
  ask: "LANA can use it in requests, and always shows it on the approval card first.",
  never: "LANA won't attach or paste it. Use for things like ID scans.",
};

export function LibraryItemDialog({ state, onClose, onSaved }: { state: LibraryDialogState; onClose: () => void; onSaved: (id: string) => void }) {
  const title = !state ? "" : state.mode === "add" ? TITLES[state.kind] : state.replaceFile ? `Replace ${state.item.name}` : `Edit ${state.item.name}`;
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()} title={title} description="Preview: kept in this browser until you reload.">
      {state && <Form key={state.mode === "edit" ? state.item.id : `${state.kind}-${state.file?.name ?? ""}`} state={state} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function nameFromFile(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function Form({ state, onClose, onSaved }: { state: NonNullable<LibraryDialogState>; onClose: () => void; onSaved: (id: string) => void }) {
  const editing: LibraryItem | undefined = state.mode === "edit" ? state.item : undefined;
  const kind = editing?.kind ?? (state.mode === "add" ? state.kind : "file");
  const initialFile = state.mode === "add" ? state.file : undefined;

  const [name, setName] = useState(editing?.name ?? (initialFile ? nameFromFile(initialFile.name) : ""));
  const [aliases, setAliases] = useState<string[]>(editing?.aliases ?? []);
  const [aliasInput, setAliasInput] = useState("");
  const [sharing, setSharing] = useState<"ask" | "never">(editing?.sharing ?? "ask");
  const [url, setUrl] = useState(editing?.link?.url ?? "");
  const [text, setText] = useState(editing?.text?.body ?? "");
  const [file, setFile] = useState<File | undefined>(initialFile);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const draft: LibraryDraft = {
    kind,
    name,
    aliases,
    sharing,
    url,
    text,
    file: file && { name: file.name, size: file.size, type: file.type },
  };
  const { errors, aliasConflicts } = validateLibraryDraft(draft, getLibrary(), editing?.id);
  const valid = Object.keys(errors).length === 0;

  function addAlias(raw: string) {
    const parts = raw.split(",").map((a) => a.trim()).filter(Boolean);
    if (parts.length) setAliases((list) => [...list, ...parts.filter((p) => !list.some((x) => x.toLowerCase() === p.toLowerCase()))]);
    setAliasInput("");
  }

  function onAliasKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAlias(aliasInput);
    } else if (e.key === "Backspace" && !aliasInput && aliases.length) {
      setAliases((list) => list.slice(0, -1));
    }
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    if (!name.trim()) setName(nameFromFile(f.name));
  }

  function save() {
    setSubmitted(true);
    if (!valid) return;
    const allAliases = aliasInput.trim() ? [...aliases, aliasInput.trim()] : aliases;
    const fileData = file && { fileName: file.name, size: file.size, mimeType: file.type || "application/octet-stream", previewUrl: URL.createObjectURL(file) };
    const common = { name: name.trim(), aliases: allAliases, sharing };

    if (editing) {
      updateLibraryItem(editing.id, {
        ...common,
        ...(kind === "link" && { link: { url: normalizeUrl(url)! } }),
        ...(kind === "text" && { text: { body: text.trim() } }),
      });
      if (fileData) replaceLibraryFile(editing.id, fileData);
      toast({ title: fileData ? "File replaced" : "Saved", description: common.name, tone: "success" });
      onSaved(editing.id);
    } else {
      const item = createLibraryItem({
        kind,
        ...common,
        ...(kind === "file" && { file: fileData }),
        ...(kind === "link" && { link: { url: normalizeUrl(url)! } }),
        ...(kind === "text" && { text: { body: text.trim() } }),
      });
      toast({ title: "Added to Library", description: item.name, tone: "success" });
      onSaved(item.id);
    }
    onClose();
  }

  const showErr = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-4 pb-2"
    >
      {kind === "file" && (
        <Field label="File" error={showErr("file")}>
          {(p) => (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-line-strong px-3 py-2.5">
              <FileUp className="size-4 shrink-0 text-fg-subtle" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {file ? (
                  <>
                    <span className="text-fg">{file.name}</span> <span className="text-fg-subtle">· {formatBytes(file.size)}</span>
                  </>
                ) : editing?.file ? (
                  <>
                    <span className="text-fg">{editing.file.fileName}</span> <span className="text-fg-subtle">· current</span>
                  </>
                ) : (
                  <span className="text-fg-subtle">Up to 10 MB</span>
                )}
              </span>
              <input {...p} ref={fileRef} type="file" className="sr-only" onChange={(e) => (pickFile(e.target.files?.[0]), (e.target.value = ""))} />
              <Button size="sm" onClick={() => fileRef.current?.click()} autoFocus={state.mode === "edit" && state.replaceFile}>
                {file || editing ? "Replace" : "Choose file"}
              </Button>
            </div>
          )}
        </Field>
      )}

      <Field label="Name" hint="What you'll call it when you ask LANA, e.g. “my CV”." error={showErr("name")}>
        {(p) => <Input {...p} autoFocus={!(state.mode === "edit" && state.replaceFile)} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CV" />}
      </Field>

      {kind === "link" && (
        <Field label="Link" error={showErr("url")}>
          {(p) => <Input {...p} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="emmanuelola.dev" inputMode="url" />}
        </Field>
      )}

      {kind === "text" && (
        <Field label="Text" error={showErr("text")}>
          {(p) => <Textarea {...p} value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="e.g. a short bio or your mailing address" />}
        </Field>
      )}

      <Field label="Also known as" optional hint="Other names LANA should recognise. Press Enter or comma to add.">
        {(p) => (
          <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-line bg-panel px-1.5 py-1 focus-within:border-accent-line focus-within:ring-3 focus-within:ring-accent-soft">
            {aliases.map((a) => (
              <span key={a} className="inline-flex h-6 items-center gap-1 rounded bg-raised pl-2 pr-0.5 text-xs text-fg">
                {a}
                <button
                  type="button"
                  aria-label={`Remove ${a}`}
                  onClick={() => setAliases((list) => list.filter((x) => x !== a))}
                  className="grid size-5 place-items-center rounded text-fg-subtle hover:bg-hover hover:text-fg"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              {...p}
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={onAliasKey}
              onBlur={() => aliasInput.trim() && addAlias(aliasInput)}
              placeholder={aliases.length ? "" : "resume, curriculum vitae"}
              className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
            />
          </div>
        )}
      </Field>

      {aliasConflicts.length > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-fg">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" />
          <span>
            {aliasConflicts.map((c, i) => (
              <span key={c.alias}>
                {i > 0 && " "}“{c.alias}” is also a name for {c.itemName}.
              </span>
            ))}{" "}
            LANA will ask which one you mean.
          </span>
        </p>
      )}

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-fg-muted">Sharing</legend>
        <Segmented
          label="Sharing"
          value={sharing}
          onChange={setSharing}
          options={[
            { value: "ask", label: "Ask me each time" },
            { value: "never", label: "Never share" },
          ]}
        />
        <p className="mt-1.5 text-xs text-fg-subtle">{SHARING_HINT[sharing]}</p>
      </fieldset>

      <div className="-mx-5 mt-1 flex justify-end gap-2 border-t border-line-subtle px-5 pt-3">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {editing ? "Save" : "Add to Library"}
        </Button>
      </div>
    </form>
  );
}
