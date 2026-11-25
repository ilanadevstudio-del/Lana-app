"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { Copy, Download, ExternalLink, FileUp, Pencil, Trash2, X } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { Avatar } from "@/components/ui/avatar";
import { PreviewTag } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { integrationName } from "@/lib/data/integration-catalog";
import { updateLibraryItem } from "@/lib/data/library";
import type { LibraryItem } from "@/lib/data/types";
import { formatBytes, formatRelative, formatShortDate } from "@/lib/format";
import { ItemTile } from "./item-tile";
import { SHARING_HINT } from "./library-item-dialog";
import { previewMode, recipientLabel } from "./library-meta";

/** Everything about one Library item: preview, names LANA knows, sharing, versions and where it went. */
export function LibraryDetail({
  item,
  onEdit,
  onReplace,
  onDelete,
}: {
  item: LibraryItem;
  onEdit: () => void;
  onReplace: () => void;
  onDelete: () => void;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(item.link?.url ?? item.text?.body ?? "");
      toast({ title: item.kind === "link" ? "Link copied" : "Text copied", tone: "success" });
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", tone: "danger" });
    }
  }

  return (
    <div className="flex flex-col">
      <Preview item={item} />

      <div className="px-4 pb-4 pt-1">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-base font-semibold leading-6 text-fg">{item.name}</h2>
          <Button size="sm" variant="ghost" icon={<Pencil />} onClick={onEdit}>
            Edit
          </Button>
        </div>
        {item.description && <p className="mt-1 text-sm text-fg-muted">{item.description}</p>}
      </div>

      <Section title="LANA knows this as">
        <Aliases key={item.id} item={item} />
      </Section>

      <Section title="Sharing">
        <Segmented
          label="Sharing"
          size="sm"
          value={item.sharing}
          onChange={(sharing) => {
            updateLibraryItem(item.id, { sharing });
            toast({ title: sharing === "never" ? "LANA won't share this" : "LANA will ask before sharing this" });
          }}
          options={[
            { value: "ask", label: "Ask me each time" },
            { value: "never", label: "Never share" },
          ]}
        />
        <p className="mt-1.5 text-xs text-fg-subtle">{SHARING_HINT[item.sharing]}</p>
      </Section>

      {item.file && (
        <Section title="Versions">
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-fg">{item.file.fileName}</span>
              <span className="text-xs text-fg-subtle">{formatBytes(item.file.size)}</span>
              <span className="rounded bg-accent-soft px-1.5 text-2xs font-medium leading-[18px] text-accent-text">Current</span>
            </li>
            {item.versions?.map((v) => (
              <li key={v.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-fg-muted">{v.fileName}</span>
                <span className="text-xs text-fg-subtle">{formatBytes(v.size)}</span>
                <span className="text-xs text-fg-faint">Replaced {formatShortDate(v.replacedAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Shared with">
        {item.shares.length === 0 ? (
          <p className="text-sm text-fg-subtle">{item.sharing === "never" ? "Set to never share." : "Not shared yet."}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {item.shares.map((s, i) => {
              const row = (
                <>
                  <Avatar name={recipientLabel(s.to).replace("#", "")} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{s.to}</span>
                    <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                      <IntegrationLogo id={s.via} size={12} bare />
                      {integrationName(s.via)} · {formatRelative(s.at)}
                    </span>
                  </span>
                  <PreviewTag />
                </>
              );
              return (
                <li key={`${s.at}-${i}`}>
                  {s.actionId ? (
                    <Link href="/activity" className="-mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-hover">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 py-1">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="flex flex-wrap gap-2 border-t border-line-subtle px-4 py-3">
        {item.kind === "file" && (
          <Button size="sm" icon={<FileUp />} onClick={onReplace}>
            Replace
          </Button>
        )}
        {item.file?.previewUrl && (
          <a href={item.file.previewUrl} download={item.file.fileName} className={buttonStyles({ size: "sm" })}>
            <Download />
            Download
          </a>
        )}
        {item.kind !== "file" && (
          <Button size="sm" icon={<Copy />} onClick={copy}>
            Copy
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={onDelete} className="ml-auto text-danger hover:bg-danger-soft hover:text-danger">
          Remove
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line-subtle px-4 py-4">
      <h3 className="mb-2 text-xs font-medium text-fg-subtle">{title}</h3>
      {children}
    </section>
  );
}

function Preview({ item }: { item: LibraryItem }) {
  const mode = previewMode(item);
  const frame = "mx-4 mt-4 mb-3 overflow-hidden rounded-lg border border-line bg-raised";
  switch (mode) {
    case "image":
      return (
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element -- object URL from a local upload */}
          <img src={item.file!.previewUrl} alt={item.name} className="max-h-72 w-full object-contain" />
        </div>
      );
    case "pdf":
      return (
        <div className={frame}>
          <iframe src={item.file!.previewUrl} title={item.file!.fileName} className="h-80 w-full bg-white" />
        </div>
      );
    case "link":
      return (
        <a
          href={item.link!.url}
          target="_blank"
          rel="noreferrer"
          className={`${frame} flex items-center gap-3 px-3.5 py-3 text-sm text-accent-text transition-colors hover:border-line-strong`}
        >
          <ItemTile item={item} size={32} />
          <span className="min-w-0 flex-1 truncate">{item.link!.url}</span>
          <ExternalLink className="size-4 shrink-0" />
        </a>
      );
    case "text":
      return <blockquote className={`${frame} whitespace-pre-wrap px-3.5 py-3 text-sm leading-6 text-fg`}>{item.text!.body}</blockquote>;
    default:
      return (
        <div className={`${frame} flex flex-col items-center gap-2 px-4 py-6 text-center`}>
          <ItemTile item={item} size={52} />
          <span className="text-sm text-fg">{item.file?.fileName}</span>
          <span className="text-xs text-fg-subtle">{mode === "sample" ? "Preview available after upload" : "No preview for this file type"}</span>
        </div>
      );
  }
}

function Aliases({ item }: { item: LibraryItem }) {
  const [value, setValue] = useState("");
  const names = [item.name, ...item.aliases];

  function add() {
    const alias = value.trim();
    if (alias && !names.some((n) => n.toLowerCase() === alias.toLowerCase())) updateLibraryItem(item.id, { aliases: [...item.aliases, alias] });
    setValue("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !value && item.aliases.length) {
      updateLibraryItem(item.id, { aliases: item.aliases.slice(0, -1) });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex h-6 items-center rounded bg-raised px-2 text-xs font-medium text-fg">“my {item.name.toLowerCase()}”</span>
      {item.aliases.map((a) => (
        <span key={a} className="inline-flex h-6 items-center gap-1 rounded bg-raised pl-2 pr-0.5 text-xs text-fg">
          “my {a.toLowerCase()}”
          <button
            type="button"
            aria-label={`Remove ${a}`}
            onClick={() => updateLibraryItem(item.id, { aliases: item.aliases.filter((x) => x !== a) })}
            className="grid size-5 place-items-center rounded text-fg-subtle hover:bg-hover hover:text-fg"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        aria-label="Add another name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder="Add a name…"
        className="h-6 min-w-24 flex-1 rounded bg-transparent px-1 text-xs text-fg placeholder:text-fg-faint focus:outline-none"
      />
    </div>
  );
}
