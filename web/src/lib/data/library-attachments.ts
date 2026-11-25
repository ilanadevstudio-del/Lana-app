import { formatBytes } from "@/lib/format";
import type { LibraryAttachment, LibraryItem } from "./types";

/** A Library item as it appears on an approval card, snapshotted when the approval is drafted. */
export function attachmentFor(item: LibraryItem): LibraryAttachment {
  const detail = item.file ? `${item.file.fileName} · ${formatBytes(item.file.size)}` : item.link ? item.link.url : "Pasted into the message";
  return { libraryItemId: item.id, kind: item.kind, name: item.name, detail };
}

export interface AttachmentProblem {
  attachment: LibraryAttachment;
  reason: "removed" | "never" | "changed";
  message: string;
}

/**
 * Attachments that can no longer be sent exactly as the approval card shows them:
 * the item was removed, switched to never share, or its file changed since drafting.
 */
export function attachmentProblems(attachments: LibraryAttachment[], items: LibraryItem[]): AttachmentProblem[] {
  const problems: AttachmentProblem[] = [];
  for (const attachment of attachments) {
    const item = items.find((i) => i.id === attachment.libraryItemId);
    if (!item) problems.push({ attachment, reason: "removed", message: `${attachment.name} was removed from your Library.` });
    else if (item.sharing === "never") problems.push({ attachment, reason: "never", message: `${item.name} is now set to never share.` });
    else if (attachmentFor(item).detail !== attachment.detail)
      problems.push({ attachment, reason: "changed", message: `${item.name} changed since this was drafted. Ask again to send the current file.` });
  }
  return problems;
}
