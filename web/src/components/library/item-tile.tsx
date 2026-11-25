import { AlignLeft, File, FileImage, FileText, Link2, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LibraryItem } from "@/lib/data/types";

/** Short type label for a file: PDF, DOC, IMG, XLS, ZIP or FILE. */
export function fileTypeLabel(mimeType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/pdf" || ext === "pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (/word|document/.test(mimeType) || ["doc", "docx", "odt", "rtf"].includes(ext)) return "DOC";
  if (/sheet|excel|csv/.test(mimeType) || ["xls", "xlsx", "csv"].includes(ext)) return "XLS";
  if (/zip|compressed/.test(mimeType) || ["zip", "rar", "7z"].includes(ext)) return "ZIP";
  return "FILE";
}

/**
 * Visual for a Library item: a thumbnail for images uploaded this session,
 * otherwise a tile showing the kind. A lock marks never-share items.
 */
export function ItemTile({ item, size = 32, className }: { item: LibraryItem; size?: number; className?: string }) {
  const radius = Math.max(5, Math.round(size * 0.22));
  const iconSize = Math.round(size * 0.42);
  let body;
  if (item.file?.previewUrl && item.file.mimeType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element -- object URL from a local upload
    body = <img src={item.file.previewUrl} alt="" className="size-full object-cover" />;
  } else if (item.file) {
    const label = fileTypeLabel(item.file.mimeType, item.file.fileName);
    const Icon = label === "IMG" ? FileImage : label === "FILE" ? File : FileText;
    body =
      size >= 28 ? (
        <span className="flex flex-col items-center gap-px">
          <Icon style={{ width: iconSize * 0.85, height: iconSize * 0.85 }} className="text-fg-subtle" strokeWidth={1.8} />
          <span className="font-semibold leading-none tracking-wide text-fg-muted" style={{ fontSize: Math.max(7, size * 0.2) }}>
            {label}
          </span>
        </span>
      ) : (
        <Icon style={{ width: iconSize, height: iconSize }} className="text-fg-subtle" />
      );
  } else {
    const Icon = item.kind === "link" ? Link2 : AlignLeft;
    body = <Icon style={{ width: iconSize, height: iconSize }} className="text-fg-subtle" />;
  }

  return (
    <span
      aria-hidden
      className={cn("relative grid shrink-0 place-items-center overflow-hidden border border-line bg-raised", className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {body}
      {item.sharing === "never" && (
        <span className="absolute -bottom-px -right-px grid size-3.5 place-items-center rounded-tl-[4px] bg-overlay text-fg-muted ring-1 ring-line">
          <Lock className="size-2.5" strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}
